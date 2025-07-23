import { supabase } from '../config/supabaseNew';
import { getServiceById } from '../data/hospitalServices';

export interface ServiceTransaction {
  id?: string;
  patient_id: string;
  service_booking_id?: string;
  service_id: string;
  service_name: string;
  service_category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  is_corporate: boolean;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  payment_mode?: 'CASH' | 'ONLINE' | 'INSURANCE' | 'PENDING';
  transaction_date: string;
  completed_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class ServiceTransactionService {
  
  /**
   * Create a service transaction when a service is booked
   */
  static async createServiceTransaction(
    patientId: string,
    serviceId: string,
    quantity: number = 1,
    isCorporate: boolean = false,
    serviceBookingId?: string,
    notes?: string
  ): Promise<ServiceTransaction> {
    try {
      const service = getServiceById(serviceId);
      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }

      const unitPrice = isCorporate ? service.corporateRate : service.generalRate;
      const totalAmount = unitPrice * quantity;

      const transactionData: Omit<ServiceTransaction, 'id' | 'created_at' | 'updated_at'> = {
        patient_id: patientId,
        service_booking_id: serviceBookingId,
        service_id: serviceId,
        service_name: service.name,
        service_category: service.category,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        is_corporate: isCorporate,
        status: 'PENDING',
        payment_mode: 'PENDING',
        transaction_date: new Date().toISOString(),
        notes
      };

      const { data, error } = await supabase
        .from('service_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      // Also create a corresponding patient transaction record
      await supabase
        .from('patient_transactions')
        .insert({
          patient_id: patientId,
          transaction_type: 'SERVICE',
          description: `${service.name} (${service.category})`,
          amount: totalAmount,
          payment_mode: 'PENDING',
          status: 'PENDING',
          doctor_name: 'Service Provider'
        });

      return data;
    } catch (error) {
      console.error('Error creating service transaction:', error);
      throw error;
    }
  }

  /**
   * Create multiple service transactions for a booking
   */
  static async createServiceTransactionsForBooking(
    patientId: string,
    serviceIds: string[],
    isCorporate: boolean = false,
    serviceBookingId?: string
  ): Promise<ServiceTransaction[]> {
    try {
      const transactions: ServiceTransaction[] = [];
      
      for (const serviceId of serviceIds) {
        const transaction = await this.createServiceTransaction(
          patientId,
          serviceId,
          1,
          isCorporate,
          serviceBookingId
        );
        transactions.push(transaction);
      }

      return transactions;
    } catch (error) {
      console.error('Error creating service transactions for booking:', error);
      throw error;
    }
  }

  /**
   * Complete a service transaction (mark as completed and process payment)
   */
  static async completeServiceTransaction(
    transactionId: string,
    paymentMode: 'CASH' | 'ONLINE' | 'INSURANCE',
    completedDate?: string
  ): Promise<ServiceTransaction> {
    try {
      const { data, error } = await supabase
        .from('service_transactions')
        .update({
          status: 'COMPLETED',
          payment_mode: paymentMode,
          completed_date: completedDate || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Update corresponding patient transaction
      await supabase
        .from('patient_transactions')
        .update({
          status: 'COMPLETED',
          payment_mode: paymentMode
        })
        .eq('patient_id', data.patient_id)
        .eq('description', `${data.service_name} (${data.service_category})`)
        .eq('amount', data.total_amount);

      return data;
    } catch (error) {
      console.error('Error completing service transaction:', error);
      throw error;
    }
  }

  /**
   * Cancel a service transaction
   */
  static async cancelServiceTransaction(
    transactionId: string,
    reason?: string
  ): Promise<ServiceTransaction> {
    try {
      const { data, error } = await supabase
        .from('service_transactions')
        .update({
          status: 'CANCELLED',
          notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Update corresponding patient transaction
      await supabase
        .from('patient_transactions')
        .update({
          status: 'CANCELLED'
        })
        .eq('patient_id', data.patient_id)
        .eq('description', `${data.service_name} (${data.service_category})`)
        .eq('amount', data.total_amount);

      return data;
    } catch (error) {
      console.error('Error cancelling service transaction:', error);
      throw error;
    }
  }

  /**
   * Process refund for a service transaction
   */
  static async refundServiceTransaction(
    transactionId: string,
    refundAmount?: number,
    reason?: string
  ): Promise<ServiceTransaction> {
    try {
      // Get the original transaction
      const { data: originalTransaction, error: fetchError } = await supabase
        .from('service_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      const actualRefundAmount = refundAmount || originalTransaction.total_amount;

      const { data, error } = await supabase
        .from('service_transactions')
        .update({
          status: 'REFUNDED',
          notes: reason ? `Refunded (₹${actualRefundAmount}): ${reason}` : `Refunded: ₹${actualRefundAmount}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      // Create a refund transaction record
      await supabase
        .from('patient_transactions')
        .insert({
          patient_id: originalTransaction.patient_id,
          transaction_type: 'REFUND',
          description: `Refund: ${originalTransaction.service_name}`,
          amount: -actualRefundAmount, // Negative amount for refund
          payment_mode: originalTransaction.payment_mode || 'CASH',
          status: 'COMPLETED',
          doctor_name: 'System Refund'
        });

      return data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get service transactions for a patient
   */
  static async getPatientServiceTransactions(patientId: string): Promise<ServiceTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('service_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching patient service transactions:', error);
      throw error;
    }
  }

  /**
   * Get service transactions for a booking
   */
  static async getBookingServiceTransactions(bookingId: string): Promise<ServiceTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('service_transactions')
        .select('*')
        .eq('service_booking_id', bookingId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching booking service transactions:', error);
      throw error;
    }
  }

  /**
   * Get all service transactions with filters
   */
  static async getServiceTransactions(
    filters: {
      status?: ServiceTransaction['status'];
      patientId?: string;
      serviceCategory?: string;
      dateFrom?: string;
      dateTo?: string;
      paymentMode?: ServiceTransaction['payment_mode'];
    } = {}
  ): Promise<ServiceTransaction[]> {
    try {
      let query = supabase
        .from('service_transactions')
        .select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      if (filters.serviceCategory) {
        query = query.eq('service_category', filters.serviceCategory);
      }
      if (filters.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }
      if (filters.paymentMode) {
        query = query.eq('payment_mode', filters.paymentMode);
      }

      const { data, error } = await query.order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching service transactions:', error);
      throw error;
    }
  }

  /**
   * Get service transaction statistics
   */
  static async getServiceTransactionStats(
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    completedTransactions: number;
    pendingTransactions: number;
    cancelledTransactions: number;
    refundedAmount: number;
    corporateRevenue: number;
    generalRevenue: number;
    categoryBreakdown: Record<string, { count: number; revenue: number }>;
  }> {
    try {
      let query = supabase
        .from('service_transactions')
        .select('*');

      if (dateFrom) {
        query = query.gte('transaction_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('transaction_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const transactions = data || [];
      const stats = {
        totalTransactions: transactions.length,
        totalRevenue: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        cancelledTransactions: 0,
        refundedAmount: 0,
        corporateRevenue: 0,
        generalRevenue: 0,
        categoryBreakdown: {} as Record<string, { count: number; revenue: number }>
      };

      transactions.forEach(transaction => {
        // Status counts
        switch (transaction.status) {
          case 'COMPLETED':
            stats.completedTransactions++;
            stats.totalRevenue += transaction.total_amount;
            break;
          case 'PENDING':
            stats.pendingTransactions++;
            break;
          case 'CANCELLED':
            stats.cancelledTransactions++;
            break;
          case 'REFUNDED':
            stats.refundedAmount += transaction.total_amount;
            break;
        }

        // Corporate vs General revenue
        if (transaction.status === 'COMPLETED') {
          if (transaction.is_corporate) {
            stats.corporateRevenue += transaction.total_amount;
          } else {
            stats.generalRevenue += transaction.total_amount;
          }
        }

        // Category breakdown
        const category = transaction.service_category;
        if (!stats.categoryBreakdown[category]) {
          stats.categoryBreakdown[category] = { count: 0, revenue: 0 };
        }
        stats.categoryBreakdown[category].count++;
        if (transaction.status === 'COMPLETED') {
          stats.categoryBreakdown[category].revenue += transaction.total_amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching service transaction stats:', error);
      throw error;
    }
  }
}

export default ServiceTransactionService;