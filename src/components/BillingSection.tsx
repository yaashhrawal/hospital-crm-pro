import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import PatientBillingModal from './billing/PatientBillingModal';
import type { PatientWithRelations } from '../config/supabaseNew';

const BillingSection: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithRelations[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'IPD' | 'OPD'>('ALL');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients, filterType]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await HospitalService.getPatients();
      setPatients(data);
    } catch (error) {
      toast.error('Failed to load patients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by department status
    if (filterType === 'IPD') {
      filtered = filtered.filter(p => p.departmentStatus === 'IPD');
    } else if (filterType === 'OPD') {
      filtered = filtered.filter(p => p.departmentStatus === 'OPD');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(patient => {
        const searchLower = searchTerm.toLowerCase();
        return (
          patient.patient_id.toLowerCase().includes(searchLower) ||
          patient.first_name.toLowerCase().includes(searchLower) ||
          patient.last_name.toLowerCase().includes(searchLower) ||
          patient.phone?.toLowerCase().includes(searchLower) ||
          patient.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredPatients(filtered);
  };

  const handleSelectPatient = (patient: PatientWithRelations) => {
    setSelectedPatient(patient);
    setShowBillingModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Billing Section</h1>
              <p className="text-gray-600 mt-1">Generate IPD, OPD, and Combined bills for patients</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <span className="font-semibold">{filteredPatients.length}</span> Patients
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Patient ID, Name, Phone, or Email..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter by:</label>
              <div className="flex rounded-lg overflow-hidden">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-4 py-2 text-sm font-medium ${
                    filterType === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Patients
                </button>
                <button
                  onClick={() => setFilterType('IPD')}
                  className={`px-4 py-2 text-sm font-medium border-l ${
                    filterType === 'IPD'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  IPD Only
                </button>
                <button
                  onClick={() => setFilterType('OPD')}
                  className={`px-4 py-2 text-sm font-medium border-l ${
                    filterType === 'OPD'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  OPD Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading patients...</div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">No patients found matching your criteria</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visits
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
                          <div className="text-sm font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.patient_id} • {patient.age || 'N/A'} / {patient.gender}
                          </div>
                          {patient.patient_tag && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {patient.patient_tag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.phone || 'No phone'}</div>
                        <div className="text-sm text-gray-500">{patient.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.departmentStatus === 'IPD'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {patient.departmentStatus || 'OPD'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ₹{(patient.totalSpent || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.visitCount || 0} visits
                        </div>
                        {patient.lastVisit && (
                          <div className="text-xs text-gray-500">
                            Last: {new Date(patient.lastVisit).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectPatient(patient)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <span>💰</span>
                          <span>Generate Bill</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Billing Modal */}
      {showBillingModal && selectedPatient && (
        <PatientBillingModal
          patient={selectedPatient}
          isOpen={showBillingModal}
          onClose={() => {
            setShowBillingModal(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default BillingSection;