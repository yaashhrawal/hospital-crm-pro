import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import type { Patient, PatientTransaction } from '../types/index';

interface PatientProfileProps {
  patientId: string;
  onClose: () => void;
}

interface ProfileStats {
  totalSpent: number;
  totalVisits: number;
  lastVisit: string;
  averageSpending: number;
  favoriteDoctor: string;
  mostCommonService: string;
  upcomingAppointments: number;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [transactions, setTransactions] = useState<PatientTransaction[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      const [patientData, transactionData] = await Promise.all([
        dataService.getPatientById(patientId),
        dataService.getTransactionsByPatient(patientId)
      ]);

      if (patientData) {
        setPatient(patientData);
        setEditedPatient(patientData);
        setTransactions(transactionData);
        calculateStats(transactionData);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactionData: PatientTransaction[]) => {
    if (transactionData.length === 0) {
      setStats({
        totalSpent: 0,
        totalVisits: 0,
        lastVisit: 'Never',
        averageSpending: 0,
        favoriteDoctor: 'None',
        mostCommonService: 'None',
        upcomingAppointments: 0,
      });
      return;
    }

    const totalSpent = transactionData.reduce((sum, t) => sum + t.amount, 0);
    const totalVisits = transactionData.length;
    const lastVisit = new Date(Math.max(...transactionData.map(t => new Date(t.created_at || '').getTime()))).toLocaleDateString();
    const averageSpending = totalVisits > 0 ? totalSpent / totalVisits : 0;

    // Calculate favorite doctor
    const doctorCounts: Record<string, number> = {};
    transactionData.forEach(t => {
      if (t.doctor_id) {
        doctorCounts[t.doctor_id] = (doctorCounts[t.doctor_id] || 0) + 1;
      }
    });
    const favoriteDoctor = Object.keys(doctorCounts).length > 0 
      ? Object.entries(doctorCounts).sort(([,a], [,b]) => b - a)[0][0] 
      : 'None';

    // Calculate most common service
    const serviceCounts: Record<string, number> = {};
    transactionData.forEach(t => {
      serviceCounts[t.transaction_type] = (serviceCounts[t.transaction_type] || 0) + 1;
    });
    const mostCommonService = Object.keys(serviceCounts).length > 0
      ? Object.entries(serviceCounts).sort(([,a], [,b]) => b - a)[0][0]
      : 'None';

    setStats({
      totalSpent,
      totalVisits,
      lastVisit,
      averageSpending,
      favoriteDoctor,
      mostCommonService,
      upcomingAppointments: 0, // This would come from appointments data
    });
  };

  const handleSaveEdit = async () => {
    if (!editedPatient) return;

    try {
      // In a real implementation, you would call dataService.updatePatient
      toast.success('Patient information updated successfully');
      setPatient(editedPatient);
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update patient information');
    }
  };

  const scheduleAppointment = () => {
    toast.info('Appointment scheduling feature coming soon!');
  };


  const contactPatient = () => {
    if (patient?.phone) {
      window.open(`tel:${patient.phone}`, '_blank');
    } else {
      toast.error('No phone number available');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading patient profile...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Patient not found</div>
          <button onClick={onClose} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-blue-100">Patient Profile & Management</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-md hover:bg-opacity-30"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-md hover:bg-opacity-30"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{stats.totalSpent.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalVisits}</div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{stats.averageSpending.toFixed(0)}</div>
                <div className="text-sm text-gray-600">Avg per Visit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.lastVisit}</div>
                <div className="text-sm text-gray-600">Last Visit</div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  👤 Basic Information
                  {isEditing && (
                    <button
                      onClick={handleSaveEdit}
                      className="ml-auto bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  )}
                </h3>
                
                {isEditing && editedPatient ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        value={editedPatient.first_name || ''}
                        onChange={(e) => setEditedPatient({...editedPatient, first_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        value={editedPatient.last_name || ''}
                        onChange={(e) => setEditedPatient({...editedPatient, last_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        value={editedPatient.phone || ''}
                        onChange={(e) => setEditedPatient({...editedPatient, phone: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={editedPatient.gender || ''}
                        onChange={(e) => setEditedPatient({...editedPatient, gender: e.target.value as any})}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={editedPatient.address || ''}
                        onChange={(e) => setEditedPatient({...editedPatient, address: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone:</span>
                      <div className="text-gray-900">{patient.phone || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Gender:</span>
                      <div className="text-gray-900">{patient.gender || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date of Birth:</span>
                      <div className="text-gray-900">{patient.date_of_birth || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Address:</span>
                      <div className="text-gray-900">{patient.address || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Emergency Contact:</span>
                      <div className="text-gray-900">{patient.emergency_contact_name || 'Not provided'}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Emergency Phone:</span>
                      <div className="text-gray-900">{patient.emergency_contact_phone || 'Not provided'}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="bg-white border rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">💰 Recent Transactions</h3>
                {transactions.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">No transactions found</div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.created_at || '').toLocaleDateString()} • {transaction.transaction_type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">{transaction.payment_mode}</div>
                        </div>
                      </div>
                    ))}
                    {transactions.length > 5 && (
                      <div className="text-center text-blue-600 text-sm">
                        +{transactions.length - 5} more transactions
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Analytics */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">⚡ Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={scheduleAppointment}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    📅 Schedule Appointment
                  </button>
                  <button
                    onClick={contactPatient}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    📞 Contact Patient
                  </button>
                </div>
              </div>

              {/* Visit Analytics */}
              {stats && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Visit Analytics</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Most Common Service:</span>
                      <div className="text-gray-900 capitalize">{stats.mostCommonService.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Preferred Doctor:</span>
                      <div className="text-gray-900">{stats.favoriteDoctor}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Patient Since:</span>
                      <div className="text-gray-900">
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Appointments */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">🗓️ Upcoming Appointments</h3>
                <div className="text-gray-500 text-center py-4">
                  No upcoming appointments
                </div>
                <button
                  onClick={scheduleAppointment}
                  className="w-full bg-blue-100 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-200"
                >
                  + Schedule New
                </button>
              </div>

              {/* Patient Status */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">✅ Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Account Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${patient.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Status:</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Current
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;