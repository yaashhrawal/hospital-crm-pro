import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import PatientHistoryModal from './PatientHistoryModal';
import type { Patient, PatientTransaction } from '../types/index';

interface PatientListItem extends Patient {
  lastVisit?: string;
  totalSpent: number;
  visitCount: number;
  nextAppointment?: string;
}

const PatientListView: React.FC = () => {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientListItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'totalSpent' | 'visitCount'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchTerm, sortBy, sortOrder]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const [patientsData, allTransactions] = await Promise.all([
        dataService.getPatients(),
        getAllTransactions()
      ]);

      const enrichedPatients: PatientListItem[] = patientsData.map(patient => {
        const patientTransactions = allTransactions.filter(t => t.patient_id === patient.id);
        const totalSpent = patientTransactions.reduce((sum, t) => sum + t.amount, 0);
        const visitCount = patientTransactions.length;
        const lastVisit = patientTransactions.length > 0 
          ? new Date(Math.max(...patientTransactions.map(t => new Date(t.created_at || '').getTime()))).toISOString().split('T')[0]
          : undefined;

        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit,
        };
      });

      setPatients(enrichedPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const getAllTransactions = async (): Promise<PatientTransaction[]> => {
    try {
      // Get transactions for recent dates
      const dates = [];
      for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const allTransactions = [];
      for (const date of dates.slice(0, 30)) { // Last 30 days for performance
        try {
          const dayTransactions = await dataService.getTransactionsByDate(date);
          allTransactions.push(...dayTransactions);
        } catch (error) {
          // Continue if a date fails
        }
      }

      return allTransactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  };

  const filterAndSortPatients = () => {
    let filtered = patients.filter(patient => {
      const searchLower = searchTerm.toLowerCase();
      return (
        patient.first_name?.toLowerCase().includes(searchLower) ||
        patient.last_name?.toLowerCase().includes(searchLower) ||
        patient.phone?.includes(searchTerm) ||
        patient.id?.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'lastVisit':
          aValue = a.lastVisit || '0000-00-00';
          bValue = b.lastVisit || '0000-00-00';
          break;
        case 'totalSpent':
          aValue = a.totalSpent;
          bValue = b.totalSpent;
          break;
        case 'visitCount':
          aValue = a.visitCount;
          bValue = b.visitCount;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
      }
    });

    setFilteredPatients(filtered);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openPatientHistory = (patient: PatientListItem) => {
    setSelectedPatient(patient);
    setShowHistory(true);
  };

  const onQuickEntrySubmit = async (data: any) => {
    try {
      const newPatient = await dataService.createPatient({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        address: data.address || '',
        gender: data.gender || 'MALE',
        date_of_birth: data.date_of_birth || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        is_active: true,
      });

      toast.success('Patient added successfully!');
      reset();
      setShowQuickEntry(false);
      loadPatients(); // Refresh the list
    } catch (error) {
      toast.error('Failed to add patient');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">👥 Patient Management</h2>
            <button
              onClick={() => setShowQuickEntry(!showQuickEntry)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              ➕ Quick Add Patient
            </button>
          </div>

          {/* Search and Stats */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, phone, or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total: {patients.length}</span>
              <span>Showing: {filteredPatients.length}</span>
            </div>
          </div>
        </div>

        {/* Quick Entry Form */}
        {showQuickEntry && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <form onSubmit={handleSubmit(onQuickEntrySubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                {...register('first_name', { required: 'First name is required' })}
                placeholder="First Name *"
                className="px-3 py-2 border rounded-md"
              />
              <input
                {...register('last_name')}
                placeholder="Last Name"
                className="px-3 py-2 border rounded-md"
              />
              <input
                {...register('phone', { required: 'Phone is required' })}
                placeholder="Phone *"
                className="px-3 py-2 border rounded-md"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickEntry(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
            {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message as string}</p>}
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message as string}</p>}
          </div>
        )}

        {/* Patient Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Patient {getSortIcon('name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('lastVisit')}
                >
                  Last Visit {getSortIcon('lastVisit')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('visitCount')}
                >
                  Visits {getSortIcon('visitCount')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalSpent')}
                >
                  Total Spent {getSortIcon('totalSpent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <button
                        onClick={() => openPatientHistory(patient)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        {patient.first_name} {patient.last_name}
                      </button>
                      <div className="text-sm text-gray-500">ID: {patient.id.slice(0, 8)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone}</div>
                    <div className="text-sm text-gray-500">{patient.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {patient.visitCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{patient.totalSpent.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openPatientHistory(patient)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      View History
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No patients found matching your search.</div>
          </div>
        )}
      </div>

      {/* Patient History Modal */}
      {showHistory && selectedPatient && (
        <PatientHistoryModal
          patient={selectedPatient}
          onClose={() => {
            setShowHistory(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientListView;