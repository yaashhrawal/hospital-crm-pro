// Billing Service for managing OPD and IPD bills across components
import { logger } from '../utils/logger';
export interface OPDBill {
  id: string;
  billId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  services: string[];
  consultationFee: number;
  investigationCharges: number;
  medicineCharges: number;
  otherCharges: number;
  discount: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  billDate: string;
  paymentMode?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
}

export interface StaySegment {
  id: string;
  roomType: 'GENERAL_WARD' | 'ICU' | 'DELUXE_ROOM' | 'PRIVATE_ROOM' | 'SEMI_PRIVATE';
  startDate: string;
  endDate: string;
  bedCharge: number;
  rmoCharge: number;
  nursingCharge: number;
  days: number;
  totalCharge: number;
}

export interface IPDService {
  name: string;
  selected: boolean;
  amount: number;
}

export interface IPDBill {
  id: string;
  billId: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  dischargeDate: string;
  admissionCharges: number;
  staySegments: StaySegment[];
  services: IPDService[];
  totalStayCharges: number;
  totalServiceCharges: number;
  discount?: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  billDate: string;
  paymentMode?: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
}

export interface RecentBill {
  id: string;
  billId: string;
  patientName: string;
  type: 'OPD' | 'IPD';
  amount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  date: string;
}

export interface BillingSummary {
  totalRevenue: number;
  opdBills: number;
  ipdBills: number;
  pendingBills: number;
}

class BillingService {
  private static readonly OPD_BILLS_KEY = 'hospital_opd_bills';
  private static readonly IPD_BILLS_KEY = 'hospital_ipd_bills';
  
  // Event listeners for bill updates
  private static listeners: Array<() => void> = [];

  // Subscribe to billing updates
  static subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of updates
  private static notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // OPD Bills Management
  static getOPDBills(): OPDBill[] {
    try {
      const bills = localStorage.getItem(this.OPD_BILLS_KEY);
      return bills ? JSON.parse(bills) : [];
    } catch (error) {
      logger.error('Failed to load OPD bills:', error);
      return [];
    }
  }

  static saveOPDBill(bill: OPDBill): void {
    try {
      const bills = this.getOPDBills();
      const existingIndex = bills.findIndex(b => b.id === bill.id);
      
      if (existingIndex >= 0) {
        bills[existingIndex] = bill;
        logger.log('📝 Updated existing OPD bill:', bill.billId);
      } else {
        bills.unshift(bill);
        logger.log('➕ Added new OPD bill:', bill.billId);
      }
      
      localStorage.setItem(this.OPD_BILLS_KEY, JSON.stringify(bills));
      logger.log('💾 Saved OPD bills to localStorage. Total bills:', bills.length);
      this.notifyListeners();
      logger.log('📢 Notified listeners of OPD bill change');
    } catch (error) {
      logger.error('Failed to save OPD bill:', error);
      throw new Error('Failed to save OPD bill');
    }
  }

  static deleteOPDBill(billId: string): void {
    try {
      const bills = this.getOPDBills().filter(bill => bill.id !== billId);
      localStorage.setItem(this.OPD_BILLS_KEY, JSON.stringify(bills));
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to delete OPD bill:', error);
      throw new Error('Failed to delete OPD bill');
    }
  }

  // IPD Bills Management
  static getIPDBills(): IPDBill[] {
    try {
      const bills = localStorage.getItem(this.IPD_BILLS_KEY);
      return bills ? JSON.parse(bills) : [];
    } catch (error) {
      logger.error('Failed to load IPD bills:', error);
      return [];
    }
  }

  static saveIPDBill(bill: IPDBill): void {
    try {
      const bills = this.getIPDBills();
      const existingIndex = bills.findIndex(b => b.id === bill.id);
      
      if (existingIndex >= 0) {
        bills[existingIndex] = bill;
      } else {
        bills.unshift(bill);
      }
      
      localStorage.setItem(this.IPD_BILLS_KEY, JSON.stringify(bills));
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to save IPD bill:', error);
      throw new Error('Failed to save IPD bill');
    }
  }

  static deleteIPDBill(billId: string): void {
    try {
      const bills = this.getIPDBills().filter(bill => bill.id !== billId);
      localStorage.setItem(this.IPD_BILLS_KEY, JSON.stringify(bills));
      this.notifyListeners();
    } catch (error) {
      logger.error('Failed to delete IPD bill:', error);
      throw new Error('Failed to delete IPD bill');
    }
  }

  // Combined Bills Data
  static getAllRecentBills(): RecentBill[] {
    const opdBills = this.getOPDBills();
    const ipdBills = this.getIPDBills();
    
    logger.log('🔍 Getting all recent bills - OPD:', opdBills.length, 'IPD:', ipdBills.length);
    
    const recentBills: RecentBill[] = [
      ...opdBills.map(bill => ({
        id: bill.id,
        billId: bill.billId,
        patientName: bill.patientName,
        type: 'OPD' as const,
        amount: bill.totalAmount,
        status: bill.status,
        date: bill.billDate
      })),
      ...ipdBills.map(bill => ({
        id: bill.id,
        billId: bill.billId,
        patientName: bill.patientName,
        type: 'IPD' as const,
        amount: bill.totalAmount,
        status: bill.status,
        date: bill.billDate
      }))
    ];

    logger.log('📋 Total recent bills:', recentBills.length);
    
    // Sort by date (newest first)
    const sortedBills = recentBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    logger.log('📊 Sorted recent bills:', sortedBills.length);
    return sortedBills;
  }

  // Dashboard Summary
  static getBillingSummary(): BillingSummary {
    const opdBills = this.getOPDBills();
    const ipdBills = this.getIPDBills();
    
    const totalOPDRevenue = opdBills
      .filter(bill => bill.status === 'PAID')
      .reduce((sum, bill) => sum + bill.totalAmount, 0);
    
    const totalIPDRevenue = ipdBills
      .filter(bill => bill.status === 'PAID')
      .reduce((sum, bill) => sum + bill.totalAmount, 0);

    const pendingOPDBills = opdBills.filter(bill => bill.status === 'PENDING').length;
    const pendingIPDBills = ipdBills.filter(bill => bill.status === 'PENDING').length;

    return {
      totalRevenue: totalOPDRevenue + totalIPDRevenue,
      opdBills: opdBills.length,
      ipdBills: ipdBills.length,
      pendingBills: pendingOPDBills + pendingIPDBills
    };
  }

  // Generate Bill ID
  static generateOPDBillId(): string {
    const opdBills = this.getOPDBills();
    const year = new Date().getFullYear();
    const sequence = opdBills.length + 1;
    return `OPD-${year}-${String(sequence).padStart(4, '0')}`;
  }

  static generateIPDBillId(): string {
    const ipdBills = this.getIPDBills();
    const year = new Date().getFullYear();
    const sequence = ipdBills.length + 1;
    return `IPD-${year}-${String(sequence).padStart(4, '0')}`;
  }

  // Clear all bills (for development/testing)
  static clearAllBills(): void {
    localStorage.removeItem(this.OPD_BILLS_KEY);
    localStorage.removeItem(this.IPD_BILLS_KEY);
    this.notifyListeners();
  }
}

export default BillingService;