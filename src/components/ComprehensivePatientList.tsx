import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';
import EditPatientModal from './EditPatientModal';
import PatientToIPDModal from './PatientToIPDModal';
import Receipt from './Receipt';
import ValantPrescription from './ValantPrescription';
import VHPrescription from './VHPrescription';
import MultiplePrescriptionGenerator from './MultiplePrescriptionGenerator';
import PatientServiceManager from './PatientServiceManager';
import { exportToExcel, formatCurrency, formatCurrencyForExcel, formatDate } from '../utils/excelExport';
import useReceiptPrinting from '../hooks/useReceiptPrinting';

interface PatientHistoryModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, isOpen, onClose }) => {
  const { printServiceReceipt } = useReceiptPrinting();
  
  if (!isOpen) return null;

  const totalSpent = patient.totalSpent || 0;
  const visitCount = patient.visitCount || 0;
  const transactions = patient.transactions || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            👤 {patient.first_name} {patient.last_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Patient Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">₹{totalSpent.toLocaleString()}</div>
            <div className="text-blue-600">Total Spent</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{visitCount}</div>
            <div className="text-green-600">Total Visits</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {patient.date_of_entry ? new Date(patient.date_of_entry).toLocaleDateString('en-IN') : 'Never'}
            </div>
            <div className="text-purple-600">Last Visit</div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">ID:</span> {patient.patient_id}</div>
            <div><span className="font-medium">Phone:</span> {patient.phone || 'Not provided'}</div>
            <div><span className="font-medium">Email:</span> {patient.email || 'Not provided'}</div>
            <div><span className="font-medium">Gender:</span> {patient.gender}</div>
            <div><span className="font-medium">Blood Group:</span> {patient.blood_group || 'Not specified'}</div>
            <div><span className="font-medium">Date of Birth:</span> {patient.date_of_birth || 'Not provided'}</div>
            {patient.patient_tag && (
              <div><span className="font-medium">Patient Tag:</span> 
                <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {patient.patient_tag}
                </span>
              </div>
            )}
            {patient.address && (
              <div className="md:col-span-2"><span className="font-medium">Address:</span> {patient.address}</div>
            )}
            {patient.medical_history && (
              <div className="md:col-span-2"><span className="font-medium">Medical History:</span> {patient.medical_history}</div>
            )}
            {patient.allergies && (
              <div className="md:col-span-2"><span className="font-medium">Allergies:</span> {patient.allergies}</div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Transaction History ({transactions.length})</h3>
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Print</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2">{new Date(transaction.created_at).toLocaleDateString()}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.transaction_type === 'CONSULTATION' ? 'bg-blue-100 text-blue-800' :
                          transaction.transaction_type === 'ADMISSION' ? 'bg-green-100 text-green-800' :
                          transaction.transaction_type === 'REFUND' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.transaction_type}
                        </span>
                      </td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">{transaction.payment_mode}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-2">
                        {transaction.status === 'COMPLETED' && (
                          <button
                            onClick={() => printServiceReceipt(transaction.id)}
                            className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
                            title="Print Receipt"
                          >
                            🖨️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No transaction history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ComprehensivePatientList: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'visits' | 'spent'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIPDModal, setShowIPDModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPatientForReceipt, setSelectedPatientForReceipt] = useState<PatientWithRelations | null>(null);
  const [showValantPrescription, setShowValantPrescription] = useState(false);
  const [showVHPrescription, setShowVHPrescription] = useState(false);
  const [showMultiplePrescription, setShowMultiplePrescription] = useState(false);
  const [multiplePrescriptionType, setMultiplePrescriptionType] = useState<'valant' | 'vh'>('valant');
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState<PatientWithRelations | null>(null);
  const [showServiceManager, setShowServiceManager] = useState(false);
  const [selectedPatientForServices, setSelectedPatientForServices] = useState<PatientWithRelations | null>(null);
  const { printConsultationReceipt } = useReceiptPrinting();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, sortBy, sortOrder, filterGender, filterTag]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading patients from new schema...');
      
      const patientsData = await HospitalService.getPatients(200);
      console.log(`✅ Loaded ${patientsData.length} patients`);
      
      setPatients(patientsData);
      
      // Extract unique tags from patients for filter dropdown
      const uniqueTags = [...new Set(
        patientsData
          .map(p => p.patient_tag)
          .filter(tag => tag && tag.trim() !== '')
      )].sort();
      setAvailableTags(uniqueTags);
    } catch (error: any) {
      console.error('❌ Failed to load patients:', error);
      toast.error(`Failed to load patients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...patients];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.first_name.toLowerCase().includes(search) ||
        patient.last_name.toLowerCase().includes(search) ||
        patient.phone.includes(search) ||
        patient.patient_id.toLowerCase().includes(search) ||
        (patient.email && patient.email.toLowerCase().includes(search))
      );
    }

    // Apply gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(patient => patient.gender === filterGender);
    }

    // Apply tag filter
    if (filterTag !== 'all') {
      filtered = filtered.filter(patient => patient.patient_tag === filterTag);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'visits':
          comparison = (a.visitCount || 0) - (b.visitCount || 0);
          break;
        case 'spent':
          comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPatients(filtered);
  };

  const handlePatientClick = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
  };

  const handleEditPatient = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setShowEditModal(true);
  };

  const handleAdmitToIPD = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setShowIPDModal(true);
  };

  const handleViewReceipt = (patient: PatientWithRelations) => {
    setSelectedPatientForReceipt(patient);
    setShowReceiptModal(true);
  };

  const handleManageServices = (patient: PatientWithRelations) => {
    setSelectedPatientForServices(patient);
    setShowServiceManager(true);
  };

  const handlePatientUpdated = () => {
    loadPatients(); // Reload patients after update
  };

  const handleIPDAdmissionSuccess = () => {
    toast.success('Patient admitted to IPD successfully');
    loadPatients(); // Reload patients after IPD admission
  };

  const handlePrescription = (patient: PatientWithRelations, template: string) => {
    setSelectedPatientForPrescription(patient);
    
    // Check if patient has multiple doctors
    const hasMultipleDoctors = patient.assigned_doctors && patient.assigned_doctors.length > 1;
    
    if (hasMultipleDoctors) {
      // Use multiple prescription generator
      setMultiplePrescriptionType(template as 'valant' | 'vh');
      setShowMultiplePrescription(true);
    } else {
      // Use single prescription (original behavior)
      if (template === 'valant') {
        setShowValantPrescription(true);
      } else if (template === 'vh') {
        setShowVHPrescription(true);
      }
    }
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const deletePatient = async (patientId: string, patientName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${patientName}?\n\nThis action cannot be undone and will remove all patient data including medical history, transactions, and appointments.`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      // Delete the patient using HospitalService
      await HospitalService.deletePatient(patientId);
      
      toast.success('Patient deleted successfully');
      await loadPatients(); // Reload the patients list
      
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error(`Failed to delete patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportPatientsToExcel = () => {
    try {
      console.log('🔍 Exporting patients, checking registration dates...');
      
      const exportData = filteredPatients.map(patient => {
        console.log(`Patient ${patient.patient_id}: created_at = ${patient.created_at}, type = ${typeof patient.created_at}`);
        
        // Debug registration date formatting
        const regDate = patient.created_at || '';
        console.log(`Registration date raw: ${regDate}`);
        const formattedRegDate = formatDate(regDate);
        console.log(`Registration date formatted: ${formattedRegDate}`);
        
        return {
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone || '',
          email: patient.email || '',
          gender: patient.gender || '',
          age: patient.age || '',
          blood_group: patient.blood_group || '',
          address: patient.address || '',
          date_of_birth: patient.date_of_birth || '',
          medical_history: patient.medical_history || '',
          allergies: patient.allergies || '',
          patient_tag: patient.patient_tag || '',
          emergency_contact: patient.emergency_contact_name || '',
          visit_count: patient.visitCount || 0,
          department_status: patient.departmentStatus || 'OPD',
          total_spent: patient.totalSpent || 0, // Clean numeric value
          last_visit: formatDate(patient.date_of_entry || ''),
          registration_date: patient.created_at || '', // Store raw date
        };
      });

      const success = exportToExcel({
        filename: `Patient_List_${new Date().toISOString().split('T')[0]}`,
        headers: [
          'Patient ID',
          'First Name',
          'Last Name', 
          'Phone',
          'Email',
          'Gender',
          'Age',
          'Blood Group',
          'Address',
          'Date of Birth',
          'Medical History',
          'Allergies',
          'Patient Tag',
          'Emergency Contact',
          'Visit Count',
          'Department Status',
          'Total Spent',
          'Last Visit',
          'Registration Date'
        ],
        data: exportData,
        formatters: {
          total_spent: (value) => formatCurrencyForExcel(value), // Clean numeric value
          last_visit: (value) => value ? formatDate(value) : 'Never',
          registration_date: (value) => value ? formatDate(value) : 'Unknown'
        }
      });

      if (success) {
        toast.success(`Exported ${filteredPatients.length} patients to Excel!`);
      } else {
        toast.error('Failed to export patient list');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading patients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">👥 Comprehensive Patient List</h1>
        <p className="text-gray-600">Complete patient management with search, filter, and detailed history</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{patients.length}</div>
          <div className="text-blue-600">Total Patients</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="text-2xl font-bold text-green-700">{filteredPatients.length}</div>
          <div className="text-green-600">Filtered Results</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            ₹{patients.reduce((sum, p) => sum + (p.totalSpent || 0), 0).toLocaleString()}
          </div>
          <div className="text-purple-600">Total Revenue</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
          <div className="text-2xl font-bold text-orange-700">
            {patients.reduce((sum, p) => sum + (p.visitCount || 0), 0)}
          </div>
          <div className="text-orange-600">Total Visits</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, email, or patient ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Gender Filter */}
          <div className="min-w-[150px]">
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* TAG Filter */}
          <div className="min-w-[180px]">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={loadPatients}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              🔄 Refresh
            </button>
            <button
              onClick={exportPatientsToExcel}
              disabled={filteredPatients.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to Excel"
            >
              📊 Export
            </button>
          </div>
        </div>
      </div>

      {/* Patient List */}
      {filteredPatients.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Patient {getSortIcon('name')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Contact</th>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('visits')}
                  >
                    Visits {getSortIcon('visits')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Department</th>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('spent')}
                  >
                    Total Spent {getSortIcon('spent')}
                  </th>
                  <th 
                    className="text-left p-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Last Visit {getSortIcon('date')}
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr 
                    key={patient.id} 
                    className={`border-b hover:bg-gray-50 cursor-pointer ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                    onClick={() => handlePatientClick(patient)}
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {patient.patient_id}</div>
                        <div className="text-sm text-gray-500">
                          {patient.gender} • {patient.blood_group || 'Unknown Blood Group'}
                          {patient.patient_tag && (
                            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                              {patient.patient_tag}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-purple-600 mt-1">
                          {patient.assigned_doctors && patient.assigned_doctors.length > 0 ? (
                            <div>
                              <span className="font-medium">
                                👨‍⚕️ {patient.assigned_doctors.find(d => d.isPrimary)?.name || patient.assigned_doctors[0]?.name}
                              </span>
                              {patient.assigned_doctors.length > 1 && (
                                <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">
                                  +{patient.assigned_doctors.length - 1} more
                                </span>
                              )}
                            </div>
                          ) : patient.assigned_doctor ? (
                            <span className="font-medium">👨‍⚕️ {patient.assigned_doctor}</span>
                          ) : (
                            <span className="text-gray-400">No doctor assigned</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{patient.phone || 'No phone'}</div>
                        <div className="text-gray-500">{patient.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {patient.visitCount || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        patient.departmentStatus === 'IPD' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {patient.departmentStatus || 'OPD'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-green-600 font-semibold">
                        ₹{(patient.totalSpent || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {(() => {
                        // Debug logging
                        console.log(`Patient ${patient.patient_id} date debug:`, {
                          date_of_entry: patient.date_of_entry,
                          created_at: patient.created_at,
                          transactions_count: patient.transactions?.length || 0
                        });
                        
                        // Prioritize date_of_entry (actual visit date) over transaction dates
                        let lastVisitDate = null;
                        
                        // First priority: use date_of_entry (the actual visit date entered by user)
                        if (patient.date_of_entry) {
                          lastVisitDate = patient.date_of_entry;
                          console.log(`Using date_of_entry: ${lastVisitDate}`);
                        }
                        // Second priority: get last transaction date
                        else if (patient.transactions && patient.transactions.length > 0) {
                          const sortedTransactions = patient.transactions.sort((a: any, b: any) => 
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                          );
                          lastVisitDate = sortedTransactions[0].created_at;
                          console.log(`Using transaction date: ${lastVisitDate}`);
                        }
                        // Third priority: use patient creation date
                        else if (patient.created_at) {
                          lastVisitDate = patient.created_at;
                          console.log(`Using created_at: ${lastVisitDate}`);
                        }
                        
                        return lastVisitDate 
                          ? new Date(lastVisitDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            })
                          : 'Never';
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(patient);
                          }}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="View Patient History"
                        >
                          📋 History
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPatient(patient);
                          }}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          title="Edit Patient Details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageServices(patient);
                          }}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          title="Manage Medical Services"
                        >
                          🔬 Services
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReceipt(patient);
                          }}
                          className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="View Receipt"
                        >
                          🧾 Receipt
                        </button>
                        <div className="relative inline-block">
                          <select
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const selectedTemplate = e.target.value;
                              if (selectedTemplate === 'valant') {
                                handlePrescription(patient, 'valant');
                              } else if (selectedTemplate === 'vh') {
                                handlePrescription(patient, 'vh');
                              }
                              e.target.value = ''; // Reset selection
                            }}
                            className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            title="Generate Prescription"
                          >
                            <option value="">📝 Prescription</option>
                            <option value="valant">Valant Template</option>
                            <option value="vh">V+H Template</option>
                          </select>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdmitToIPD(patient);
                          }}
                          className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          title="Admit to IPD"
                        >
                          🛏️ IPD
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePatient(patient.id, `${patient.first_name} ${patient.last_name}`);
                          }}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          title="Delete patient permanently"
                          disabled={loading}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No patients found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterGender !== 'all' || filterTag !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No patients have been registered yet'
            }
          </p>
          <button
            onClick={loadPatients}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            🔄 Refresh List
          </button>
        </div>
      )}

      {/* Patient History Modal */}
      {selectedPatient && (
        <PatientHistoryModal
          patient={selectedPatient}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {/* Edit Patient Modal */}
      {selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPatient(null);
          }}
          onPatientUpdated={handlePatientUpdated}
        />
      )}

      {/* Patient to IPD Modal */}
      {selectedPatient && (
        <PatientToIPDModal
          patient={selectedPatient}
          isOpen={showIPDModal}
          onClose={() => {
            setShowIPDModal(false);
            setSelectedPatient(null);
          }}
          onAdmissionSuccess={handleIPDAdmissionSuccess}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPatientForReceipt && (
        <Receipt
          patientId={selectedPatientForReceipt.id}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPatientForReceipt(null);
          }}
        />
      )}

      {/* Valant Prescription Modal */}
      {showValantPrescription && selectedPatientForPrescription && (
        <ValantPrescription
          patient={selectedPatientForPrescription}
          onClose={() => {
            setShowValantPrescription(false);
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* V+H Prescription Modal */}
      {showVHPrescription && selectedPatientForPrescription && (
        <VHPrescription
          patient={selectedPatientForPrescription}
          onClose={() => {
            setShowVHPrescription(false);
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* Multiple Prescription Generator Modal */}
      {showMultiplePrescription && selectedPatientForPrescription && (
        <MultiplePrescriptionGenerator
          patient={selectedPatientForPrescription}
          prescriptionType={multiplePrescriptionType}
          onClose={() => {
            setShowMultiplePrescription(false);
            setSelectedPatientForPrescription(null);
          }}
        />
      )}

      {/* Patient Service Manager Modal */}
      {showServiceManager && selectedPatientForServices && (
        <PatientServiceManager
          patient={selectedPatientForServices}
          onClose={() => {
            setShowServiceManager(false);
            setSelectedPatientForServices(null);
          }}
          onServicesUpdated={() => {
            loadPatients(); // Reload to update totals
          }}
        />
      )}
    </div>
  );
};

export default ComprehensivePatientList;