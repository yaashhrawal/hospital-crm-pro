import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createRoot } from 'react-dom/client';
import { Plus, Search, Edit, Printer, Download, X, Calendar, User, Stethoscope, Trash2 } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import DoctorService, { type DoctorInfo } from '../../services/doctorService';
import BillingService, { type OPDBill } from '../../services/billingService';
import type { PatientWithRelations } from '../../config/supabaseNew';
import ReceiptTemplate, { type ReceiptData } from '../receipts/ReceiptTemplate';

// Using PatientWithRelations from config instead of local interface

interface OPDBillFormData {
  patientId: string;
  doctorId: string;
  consultationFee: number;
  investigationCharges: number;
  medicineCharges: number;
  otherCharges: number;
  discount: number;
  discountReason: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  services: string[];
  notes: string;
}

const OPDBillingModule: React.FC = () => {
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [opdBills, setOpdBills] = useState<OPDBill[]>([]);
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'CANCELLED'>('ALL');

  const [formData, setFormData] = useState<OPDBillFormData>({
    patientId: '',
    doctorId: '',
    consultationFee: 500,
    investigationCharges: 0,
    medicineCharges: 0,
    otherCharges: 0,
    discount: 0,
    discountReason: '',
    paymentMode: 'CASH',
    services: [],
    notes: ''
  });

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const commonServices = [
    'General Consultation',
    'Follow-up Consultation',
    'Blood Pressure Check',
    'Blood Sugar Test',
    'ECG',
    'X-Ray',
    'Ultrasound',
    'Blood Test',
    'Urine Test',
    'Prescription',
    'Dressing',
    'Injection',
    'Vaccination',
    'Health Checkup'
  ];

  useEffect(() => {
    loadData();

    // Subscribe to billing service updates
    const unsubscribe = BillingService.subscribe(() => {
      const updatedBills = BillingService.getOPDBills();
      setOpdBills(updatedBills);
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load actual patients from HospitalService
      const actualPatients = await HospitalService.getPatients(50000, true, true);
      console.log('📋 Loaded patients for OPD billing:', actualPatients.length);

      // Load actual doctors from DoctorService (same as patient entry)
      const actualDoctors = DoctorService.getAllDoctors();
      console.log('👨‍⚕️ Loaded doctors for OPD billing:', actualDoctors.length);

      // Load existing bills from BillingService
      const existingBills = BillingService.getOPDBills();
      console.log('💰 Loaded existing OPD bills:', existingBills.length);

      setPatients(actualPatients);
      setDoctors(actualDoctors);
      setOpdBills(existingBills);

    } catch (error: any) {
      console.error('Failed to load OPD billing data:', error);
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">OPD Billing</h2>
          <p className="text-gray-600">Create and manage OPD bills</p>
        </div>
        <button
          onClick={() => setShowCreateBill(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create OPD Bill
        </button>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center">
          <Stethoscope className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">OPD Billing Module</h3>
          <p className="text-gray-600 mb-4">
            This feature is currently under development. Please use the existing billing workflow for now.
          </p>
          <div className="text-sm text-gray-500">
            Coming soon with features like:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Quick consultation billing</li>
              <li>Service-based billing</li>
              <li>Multiple payment modes</li>
              <li>Digital receipts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPDBillingModule;