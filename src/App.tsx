import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import dataService from './services/dataService';
import type { Patient, PatientTransaction, DailyExpense, Gender, PaymentMode } from './types/index';

// Simple Patient Entry Form
const SimplePatientEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    selected_doctor: '',
    custom_doctor_name: '',
    selected_department: '',
    entry_fee: 100,
    consultation_fee: 0,
    discount_amount: 0,
    discount_reason: '',
  });

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [doctorsData, departmentsData] = await Promise.all([
        dataService.getDoctors(),
        dataService.getDepartments(),
      ]);
      setDoctors(doctorsData);
      setDepartments(departmentsData);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create patient
      const newPatient = await dataService.createPatient({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
        date_of_birth: formData.date_of_birth,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        is_active: true,
      });

      // Create entry fee transaction
      await dataService.createTransaction({
        patient_id: newPatient.id,
        transaction_type: 'entry_fee',
        amount: formData.entry_fee,
        payment_mode: 'cash',
        doctor_id: formData.selected_doctor,
        department: formData.selected_department,
        description: 'Hospital Entry Fee',
      });

      // Create consultation fee transaction
      const doctorName = formData.selected_doctor === 'custom' 
        ? formData.custom_doctor_name 
        : doctors.find(d => d.id === formData.selected_doctor)?.name || 'Doctor';
      
      await dataService.createTransaction({
        patient_id: newPatient.id,
        transaction_type: 'consultation',
        amount: formData.consultation_fee,
        payment_mode: 'cash',
        doctor_id: formData.selected_doctor === 'custom' ? 'custom' : formData.selected_doctor,
        department: formData.selected_department,
        description: `Consultation with ${doctorName}`,
      });

      // Create discount transaction if applicable
      if (formData.discount_amount > 0) {
        await dataService.createTransaction({
          patient_id: newPatient.id,
          transaction_type: 'discount',
          amount: -formData.discount_amount,
          payment_mode: 'adjustment',
          doctor_id: formData.selected_doctor === 'custom' ? 'custom' : formData.selected_doctor,
          department: formData.selected_department,
          description: `Discount: ${formData.discount_reason}`,
        });
      }

      toast.success(`Patient registered successfully! Total: ₹${totalAmount}`);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        selected_doctor: '',
        custom_doctor_name: '',
        selected_department: '',
        entry_fee: 100,
        consultation_fee: 0,
        discount_amount: 0,
        discount_reason: '',
      });
    } catch (error) {
      toast.error('Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.entry_fee + formData.consultation_fee - formData.discount_amount;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🏥 Patient Registration & Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select
              value={formData.selected_department}
              onChange={(e) => setFormData({...formData, selected_department: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
            <select
              value={formData.selected_doctor}
              onChange={(e) => {
                const selectedDoc = doctors.find(d => d.id === e.target.value);
                setFormData({
                  ...formData, 
                  selected_doctor: e.target.value,
                  consultation_fee: selectedDoc?.fee || 0,
                  custom_doctor_name: e.target.value === 'custom' ? '' : ''
                });
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Doctor</option>
              {doctors.filter(d => d.department === formData.selected_department).map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - ₹{doctor.fee}
                </option>
              ))}
              <option value="custom">+ Add Custom Doctor</option>
            </select>
          </div>

          {formData.selected_doctor === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
              <input
                type="text"
                value={formData.custom_doctor_name}
                onChange={(e) => setFormData({...formData, custom_doctor_name: e.target.value})}
                required
                placeholder="Enter doctor name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (₹) *</label>
            <input
              type="number"
              value={formData.entry_fee}
              onChange={(e) => setFormData({...formData, entry_fee: parseInt(e.target.value) || 0})}
              min="50"
              max="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
            <input
              type="number"
              value={formData.consultation_fee}
              onChange={(e) => setFormData({...formData, consultation_fee: parseInt(e.target.value) || 0})}
              required
              placeholder="Enter consultation fee"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
            <input
              type="number"
              value={formData.discount_amount}
              onChange={(e) => setFormData({...formData, discount_amount: parseInt(e.target.value) || 0})}
              placeholder="Enter discount amount"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formData.discount_amount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Reason *</label>
              <input
                type="text"
                value={formData.discount_reason}
                onChange={(e) => setFormData({...formData, discount_reason: e.target.value})}
                required
                placeholder="Enter discount reason"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            required
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
          <input
            type="text"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
          <input
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Total Fees</h3>
            <div className="text-2xl font-bold text-blue-600">₹{totalAmount}</div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Entry Fee: ₹{formData.entry_fee} + Consultation: ₹{formData.consultation_fee}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Registering...' : `Register Patient & Collect ₹${totalAmount}`}
        </button>
      </form>
    </div>
  );
};

// Simple Daily Operations View
const SimpleDailyOperations: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transactionsData, expensesData, patientsData] = await Promise.all([
        dataService.getTransactionsByDate(selectedDate),
        dataService.getExpensesByDate(selectedDate),
        dataService.getPatients(),
      ]);
      setTransactions(transactionsData);
      setExpenses(expensesData);
      setPatients(patientsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netRevenue = totalIncome - totalExpenses;

  const patientTransactions = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.patient_id]) {
      acc[transaction.patient_id] = [];
    }
    acc[transaction.patient_id].push(transaction);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📊 Daily Operations Dashboard</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">₹{totalIncome}</div>
          <div className="text-sm text-gray-600">Total Income</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">₹{totalExpenses}</div>
          <div className="text-sm text-gray-600">Total Expenses</div>
        </div>
        <div className={`p-6 rounded-lg ${netRevenue >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-2xl font-bold ${netRevenue >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ₹{netRevenue}
          </div>
          <div className="text-sm text-gray-600">Net Revenue</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(patientTransactions).length}</div>
          <div className="text-sm text-gray-600">Patients Served</div>
        </div>
      </div>

      {/* Patient Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Patient Journeys</h2>
        {Object.keys(patientTransactions).length === 0 ? (
          <p className="text-gray-500">No patient data for selected date</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(patientTransactions).map(([patientId, ptransactions]) => {
              const patient = patients.find((p: Patient) => p.id === patientId);
              const transactionsArray = Array.isArray(ptransactions) ? ptransactions as PatientTransaction[] : [];
              const patientTotal = transactionsArray.reduce((sum: number, t: PatientTransaction) => sum + t.amount, 0);
              
              return (
                <div key={patientId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">
                      {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                    </h3>
                    <span className="font-bold text-green-600">₹{patientTotal}</span>
                  </div>
                  <div className="space-y-1">
                    {transactionsArray.map((transaction: PatientTransaction) => (
                      <div key={transaction.id} className="flex justify-between text-sm">
                        <span className={transaction.amount < 0 ? 'text-red-600' : ''}>
                          {transaction.description}
                          {transaction.transaction_type === 'discount' && ' 🏷️'}
                          {transaction.transaction_type === 'refund' && ' 💰'}
                        </span>
                        <span className={`${transaction.amount < 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                          {transaction.amount < 0 ? '-₹' + Math.abs(transaction.amount) : '₹' + transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expenses */}
      {expenses.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Daily Expenses</h2>
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium">{expense.description}</span>
                  <span className="text-sm text-gray-500 ml-2">({expense.expense_category})</span>
                </div>
                <span className="font-semibold text-red-600">₹{expense.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Expense Entry
const SimpleExpenseEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    expense_category: 'medical_supplies',
    custom_category: '',
    description: '',
    amount: 0,
    payment_mode: 'cash' as 'cash' | 'online' | 'card' | 'upi',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        expense_category: (formData.expense_category === 'custom' ? formData.custom_category : formData.expense_category) as 'salaries' | 'utilities' | 'medical_supplies' | 'maintenance' | 'administrative',
        custom_category: formData.custom_category,
        description: formData.description,
        amount: formData.amount,
        payment_mode: formData.payment_mode as PaymentMode,
        date: formData.date,
        approved_by: 'admin',
      };
      await dataService.createExpense(expenseData as Omit<DailyExpense, 'id'>);
      toast.success(`Expense of ₹${formData.amount} recorded successfully`);
      setFormData({
        ...formData,
        description: '',
        amount: 0,
        custom_category: '',
      });
    } catch (error) {
      toast.error('Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">💸 Daily Expense Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.expense_category}
            onChange={(e) => setFormData({...formData, expense_category: e.target.value, custom_category: e.target.value === 'custom' ? '' : formData.custom_category})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="salaries">👥 Staff Salaries</option>
            <option value="utilities">⚡ Utilities</option>
            <option value="medical_supplies">💊 Medical Supplies</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="administrative">📋 Administrative</option>
            <option value="custom">+ Add Custom Category</option>
          </select>
        </div>

        {formData.expense_category === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Category *</label>
            <input
              type="text"
              value={formData.custom_category}
              onChange={(e) => setFormData({...formData, custom_category: e.target.value})}
              required
              placeholder="Enter custom category"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            placeholder="Enter expense description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
          <select
            value={formData.payment_mode}
            onChange={(e) => setFormData({...formData, payment_mode: e.target.value as 'cash' | 'online' | 'card' | 'upi'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">💵 Cash</option>
            <option value="online">🌐 Online</option>
            <option value="card">💳 Card</option>
            <option value="upi">📱 UPI</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
        >
          {loading ? 'Recording...' : `Record Expense ₹${formData.amount}`}
        </button>
      </form>
    </div>
  );
};

// Simple Refund Entry
const SimpleRefundEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    patient_search: '',
    selected_patient: '',
    refund_amount: 0,
    refund_reason: '',
    payment_mode: 'cash' as 'cash' | 'online' | 'card' | 'upi',
    date: new Date().toISOString().split('T')[0],
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      const patientsData = await dataService.getPatients();
      setPatients(patientsData);
    };
    loadPatients();
  }, []);

  useEffect(() => {
    if (formData.patient_search) {
      const filtered = patients.filter(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(formData.patient_search.toLowerCase()) ||
        p.patient_id.toLowerCase().includes(formData.patient_search.toLowerCase()) ||
        p.phone.includes(formData.patient_search)
      );
      setFilteredPatients(filtered.slice(0, 5));
    } else {
      setFilteredPatients([]);
    }
  }, [formData.patient_search, patients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedPatient = patients.find(p => p.id === formData.selected_patient);
      if (!selectedPatient) {
        toast.error('Please select a valid patient');
        return;
      }

      await dataService.createTransaction({
        patient_id: formData.selected_patient,
        transaction_type: 'refund',
        amount: -formData.refund_amount, // Negative amount for refund
        payment_mode: formData.payment_mode as 'cash' | 'online' | 'card' | 'upi' | 'insurance' | 'adjustment',
        doctor_id: '',
        department: 'Administration',
        description: `Refund: ${formData.refund_reason}`,
      });

      toast.success(`Refund of ₹${formData.refund_amount} processed successfully`);
      setFormData({
        patient_search: '',
        selected_patient: '',
        refund_amount: 0,
        refund_reason: '',
        payment_mode: 'cash',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">💰 Patient Refund Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient *</label>
          <input
            type="text"
            value={formData.patient_search}
            onChange={(e) => setFormData({...formData, patient_search: e.target.value, selected_patient: ''})}
            required
            placeholder="Search by name, patient ID, or phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filteredPatients.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto z-10">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      patient_search: `${patient.first_name} ${patient.last_name} (${patient.patient_id})`,
                      selected_patient: patient.id
                    });
                    setFilteredPatients([]);
                  }}
                >
                  <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                  <div className="text-sm text-gray-500">ID: {patient.patient_id} | Phone: {patient.phone}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹) *</label>
          <input
            type="number"
            value={formData.refund_amount}
            onChange={(e) => setFormData({...formData, refund_amount: parseInt(e.target.value) || 0})}
            required
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Refund Reason *</label>
          <input
            type="text"
            value={formData.refund_reason}
            onChange={(e) => setFormData({...formData, refund_reason: e.target.value})}
            required
            placeholder="Enter refund reason"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
          <select
            value={formData.payment_mode}
            onChange={(e) => setFormData({...formData, payment_mode: e.target.value as 'cash' | 'online' | 'card' | 'upi'})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cash">💵 Cash</option>
            <option value="online">🌐 Online</option>
            <option value="card">💳 Card</option>
            <option value="upi">📱 UPI</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.selected_patient}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Process Refund ₹${formData.refund_amount}`}
        </button>
      </form>
    </div>
  );
};

// Main Login Page
const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@hospital.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = await dataService.login(email, password);
      if (user) {
        toast.success('Login successful!');
        onLogin();
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          🏥 Hospital CRM Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Complete Hospital Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Default Credentials:</h3>
            <p className="text-sm text-gray-600">Email: admin@hospital.com</p>
            <p className="text-sm text-gray-600">Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('patient-entry');

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const currentUser = await dataService.getCurrentUser();
        if (currentUser) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log('Authentication check handled');
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    dataService.logout();
    setIsLoggedIn(false);
    setActiveTab('patient-entry');
    toast.success('Logged out successfully');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'patient-entry', name: '👤 Patient Entry', component: SimplePatientEntry },
    { id: 'daily-operations', name: '📊 Daily Operations', component: SimpleDailyOperations },
    { id: 'expense-entry', name: '💸 Expense Entry', component: SimpleExpenseEntry },
    { id: 'refund-entry', name: '💰 Refund Entry', component: SimpleRefundEntry },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SimplePatientEntry;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏥 Hospital CRM</h1>
              <p className="text-sm text-gray-500">Complete Management System - Supabase Backend</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <ActiveComponent />
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;