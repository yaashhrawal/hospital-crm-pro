import { supabase } from '../config/supabase';
import type { 
  Bill, 
  BillWithRelations, 
  CreateBillData, 
  PaginatedResponse,
  SupabaseQuery 
} from '../config/supabase';

export interface BillItem {
  name: string;
  quantity: number;
  unitPrice: number;
  category: 'CONSULTATION' | 'MEDICINE' | 'TEST' | 'PROCEDURE' | 'OTHER';
}

export interface BillFilters {
  patientId?: string;
  status?: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'INSURANCE';
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface BillListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: BillFilters;
}

export interface UpdateBillData extends Partial<CreateBillData> {
  status?: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  paid_amount?: number;
  payment_method?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'INSURANCE';
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
}

export interface PaymentData {
  paid_amount: number;
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'INSURANCE';
  payment_reference?: string;
  partial_payment?: boolean;
}

export interface GSTCalculation {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

class BillingService {
  private readonly GST_RATE = 0.18; // 18% GST
  private readonly CGST_RATE = 0.09; // 9% CGST
  private readonly SGST_RATE = 0.09; // 9% SGST

  /**
   * Get all bills with pagination and filters
   */
  async getBills(params: BillListParams = {}): Promise<PaginatedResponse<BillWithRelations>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        filters = {},
      } = params;

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('bills')
        .select(`
          *,
          patient:patients(
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            email
          ),
          appointment:appointments(
            id,
            appointment_id,
            scheduled_at,
            reason,
            doctor:users!appointments_doctor_id_fkey(
              id,
              first_name,
              last_name
            ),
            department:departments(
              id,
              name
            )
          ),
          created_by_user:users!bills_created_by_fkey(
            id,
            first_name,
            last_name
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      if (filters.amountRange) {
        query = query
          .gte('total_amount', filters.amountRange.min)
          .lte('total_amount', filters.amountRange.max);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count }: SupabaseQuery<BillWithRelations> = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  /**
   * Get a single bill by ID
   */
  async getBillById(id: string): Promise<BillWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          patient:patients(
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            email,
            address
          ),
          appointment:appointments(
            id,
            appointment_id,
            scheduled_at,
            reason,
            doctor:users!appointments_doctor_id_fkey(
              id,
              first_name,
              last_name
            ),
            department:departments(
              id,
              name
            )
          ),
          created_by_user:users!bills_created_by_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Bill not found
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  }

  /**
   * Create a new bill
   */
  async createBill(billData: CreateBillData, createdBy: string): Promise<Bill> {
    try {
      // Validate appointment exists and doesn't have a bill
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', billData.appointment_id)
        .single();

      if (appointmentError || !appointment) {
        throw new Error('Appointment not found');
      }

      // Check if bill already exists for this appointment
      const { data: existingBill } = await supabase
        .from('bills')
        .select('id')
        .eq('appointment_id', billData.appointment_id)
        .single();

      if (existingBill) {
        throw new Error('Bill already exists for this appointment');
      }

      // Calculate bill amounts
      const calculations = this.calculateGST(
        billData.items,
        billData.consultation_fee,
        billData.discount || 0
      );

      // Generate bill number
      const billNumber = await this.generateBillNumber();

      const { data, error } = await supabase
        .from('bills')
        .insert({
          bill_number: billNumber,
          appointment_id: billData.appointment_id,
          patient_id: billData.patient_id,
          created_by: createdBy,
          items: billData.items,
          consultation_fee: billData.consultation_fee,
          subtotal: calculations.subtotal,
          discount: billData.discount || 0,
          cgst: calculations.cgst,
          sgst: calculations.sgst,
          igst: calculations.igst,
          total_tax: calculations.totalTax,
          total_amount: calculations.grandTotal,
          notes: billData.notes,
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  /**
   * Update an existing bill
   */
  async updateBill(id: string, updates: UpdateBillData): Promise<Bill> {
    try {
      // Check if bill exists
      const { data: existingBill, error: fetchError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingBill) {
        throw new Error('Bill not found');
      }

      // If bill is already paid, prevent modification of amounts
      if (existingBill.status === 'PAID' && (updates.items || updates.consultation_fee || updates.discount)) {
        throw new Error('Cannot modify paid bill amounts');
      }

      let updateData: any = { ...updates };

      // Recalculate amounts if items or fees are updated
      if (updates.items || updates.consultation_fee !== undefined || updates.discount !== undefined) {
        const items = updates.items || existingBill.items;
        const consultationFee = updates.consultation_fee !== undefined ? updates.consultation_fee : existingBill.consultation_fee;
        const discount = updates.discount !== undefined ? updates.discount : existingBill.discount;

        const calculations = this.calculateGST(items, consultationFee, discount);
        
        updateData = {
          ...updateData,
          subtotal: calculations.subtotal,
          cgst: calculations.cgst,
          sgst: calculations.sgst,
          igst: calculations.igst,
          total_tax: calculations.totalTax,
          total_amount: calculations.grandTotal,
        };
      }

      const { data, error } = await supabase
        .from('bills')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  /**
   * Process payment for a bill
   */
  async processPayment(id: string, paymentData: PaymentData): Promise<Bill> {
    try {
      const { data: bill, error: fetchError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !bill) {
        throw new Error('Bill not found');
      }

      if (bill.status === 'PAID') {
        throw new Error('Bill is already paid');
      }

      const currentPaidAmount = bill.paid_amount || 0;
      const totalPaidAmount = currentPaidAmount + paymentData.paid_amount;

      if (totalPaidAmount > bill.total_amount) {
        throw new Error('Payment amount exceeds bill total');
      }

      // Determine new status
      let newStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' = 'PENDING';
      if (totalPaidAmount === bill.total_amount) {
        newStatus = 'PAID';
      } else if (totalPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      const updateData: any = {
        paid_amount: totalPaidAmount,
        payment_method: paymentData.payment_method,
        payment_reference: paymentData.payment_reference,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'PAID') {
        updateData.payment_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Get billing statistics
   */
  async getBillStats(): Promise<{
    total: number;
    totalRevenue: number;
    paid: number;
    pending: number;
    overdue: number;
    monthlyRevenue: number;
    statusDistribution: Record<string, number>;
    paymentMethodDistribution: Record<string, number>;
    averageBillAmount: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get basic counts and aggregates
      const [
        { count: total },
        { count: paid },
        { count: pending },
        { count: overdue },
        totalRevenueResult,
        monthlyRevenueResult,
        averageResult,
      ] = await Promise.all([
        supabase.from('bills').select('id', { count: 'exact', head: true }),
        supabase.from('bills').select('id', { count: 'exact', head: true }).eq('status', 'PAID'),
        supabase.from('bills').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('bills').select('id', { count: 'exact', head: true }).eq('status', 'OVERDUE'),
        supabase.from('bills').select('paid_amount').eq('status', 'PAID'),
        supabase.from('bills').select('paid_amount').eq('status', 'PAID').gte('payment_date', startOfMonth),
        supabase.from('bills').select('total_amount'),
      ]);

      // Calculate revenue
      const totalRevenue = totalRevenueResult.data?.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0) || 0;
      const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0) || 0;
      const averageBillAmount = averageResult.data?.reduce((sum, bill) => sum + bill.total_amount, 0) / (averageResult.data?.length || 1) || 0;

      // Get all bills for detailed stats
      const { data: bills } = await supabase
        .from('bills')
        .select('status, payment_method');

      // Calculate distributions
      const statusDistribution: Record<string, number> = {};
      const paymentMethodDistribution: Record<string, number> = {};

      bills?.forEach((bill) => {
        statusDistribution[bill.status] = (statusDistribution[bill.status] || 0) + 1;
        if (bill.payment_method) {
          paymentMethodDistribution[bill.payment_method] = (paymentMethodDistribution[bill.payment_method] || 0) + 1;
        }
      });

      return {
        total: total || 0,
        totalRevenue,
        paid: paid || 0,
        pending: pending || 0,
        overdue: overdue || 0,
        monthlyRevenue,
        statusDistribution,
        paymentMethodDistribution,
        averageBillAmount,
      };
    } catch (error) {
      console.error('Error fetching bill stats:', error);
      throw error;
    }
  }

  /**
   * Calculate GST for bill items
   */
  private calculateGST(items: BillItem[], consultationFee: number, discount: number = 0): GSTCalculation {
    // Calculate subtotal
    const itemsTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const subtotal = itemsTotal + consultationFee - discount;

    // Calculate GST (18% total - 9% CGST + 9% SGST for same state, 18% IGST for inter-state)
    // For simplicity, using CGST + SGST (same state scenario)
    const cgst = subtotal * this.CGST_RATE;
    const sgst = subtotal * this.SGST_RATE;
    const igst = 0; // Not applicable for same state
    const totalTax = cgst + sgst + igst;
    const grandTotal = subtotal + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }

  /**
   * Generate a unique bill number
   */
  private async generateBillNumber(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const prefix = `INV${currentYear}${currentMonth.toString().padStart(2, '0')}`;

      // Get the last bill number for this month
      const { data } = await supabase
        .from('bills')
        .select('bill_number')
        .like('bill_number', `${prefix}%`)
        .order('bill_number', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].bill_number.replace(prefix, ''));
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating bill number:', error);
      // Fallback to timestamp-based ID
      return `INV${Date.now()}`;
    }
  }

  /**
   * Subscribe to bill changes
   */
  subscribeToBills(callback: (payload: any) => void) {
    return supabase
      .channel('bills_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bills' 
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * Generate invoice PDF (placeholder for future implementation)
   */
  async generateInvoicePDF(billId: string): Promise<Blob> {
    try {
      // This would integrate with a PDF generation service
      // For now, return a placeholder
      const bill = await this.getBillById(billId);
      if (!bill) {
        throw new Error('Bill not found');
      }

      // Create a simple text representation
      const content = `Invoice: ${bill.bill_number}\nTotal: ₹${bill.total_amount}`;
      return new Blob([content], { type: 'text/plain' });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }
}

export const billingService = new BillingService();
export default billingService;