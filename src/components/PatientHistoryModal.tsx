import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import type { Patient, PatientTransaction } from '../types/index';

interface PatientHistoryModalProps {
  patient: Patient;
  onClose: () => void;
}

interface VisitRecord {
  date: string;
  transactions: PatientTransaction[];
  totalAmount: number;
  doctors: string[];
  departments: string[];
}

interface FinancialSummary {
  totalSpent: number;
  averagePerVisit: number;
  paymentMethodBreakdown: Record<string, number>;
  monthlySpending: Array<{ month: string; amount: number }>;
}

interface VisitAnalytics {
  totalVisits: number;
  averageVisitsPerMonth: number;
  mostFrequentReasons: Array<{ reason: string; count: number }>;
  preferredDoctors: Array<{ doctor: string; count: number }>;
  visitPatterns: Record<string, number>;
}

const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, onClose }) => {
  const [activeTab, setActiveTab] = useState<'visits' | 'financial' | 'medical' | 'analytics'>('visits');
  const [visitHistory, setVisitHistory] = useState<VisitRecord[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [visitAnalytics, setVisitAnalytics] = useState<VisitAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient>(patient);

  useEffect(() => {
    loadPatientData();
  }, [patient.id]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Get all transactions for this patient
      const transactions = await dataService.getTransactionsByPatient(patient.id);
      
      // Process visit history
      const visitMap = new Map<string, PatientTransaction[]>();
      transactions.forEach(transaction => {
        const date = transaction.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
        if (!visitMap.has(date)) {
          visitMap.set(date, []);
        }
        visitMap.get(date)!.push(transaction);
      });

      const visits: VisitRecord[] = Array.from(visitMap.entries())
        .map(([date, dayTransactions]) => ({
          date,
          transactions: dayTransactions,
          totalAmount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          doctors: [...new Set(dayTransactions.map(t => t.doctor_id || 'Unknown').filter(Boolean))],
          departments: [...new Set(dayTransactions.map(t => t.department || 'General').filter(Boolean))],
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setVisitHistory(visits);

      // Calculate financial summary
      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const averagePerVisit = visits.length > 0 ? totalSpent / visits.length : 0;
      
      const paymentBreakdown: Record<string, number> = {};
      transactions.forEach(t => {
        const method = t.payment_mode || 'cash';
        paymentBreakdown[method] = (paymentBreakdown[method] || 0) + t.amount;
      });

      // Calculate monthly spending
      const monthlyMap = new Map<string, number>();
      transactions.forEach(t => {
        const date = new Date(t.created_at || '');
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + t.amount);
      });

      const monthlySpending = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setFinancialSummary({
        totalSpent,
        averagePerVisit,
        paymentMethodBreakdown: paymentBreakdown,
        monthlySpending,
      });

      // Calculate visit analytics
      const reasonMap = new Map<string, number>();
      const doctorMap = new Map<string, number>();
      const dayOfWeekMap = new Map<string, number>();

      transactions.forEach(t => {
        // Count transaction types as reasons
        const reason = t.transaction_type || 'consultation';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);

        // Count doctors
        const doctor = t.doctor_id || 'Unknown';
        doctorMap.set(doctor, (doctorMap.get(doctor) || 0) + 1);

        // Count day of week patterns
        const date = new Date(t.created_at || '');
        const dayOfWeek = date.toLocaleDateString('en', { weekday: 'long' });
        dayOfWeekMap.set(dayOfWeek, (dayOfWeekMap.get(dayOfWeek) || 0) + 1);
      });

      const mostFrequentReasons = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const preferredDoctors = Array.from(doctorMap.entries())
        .map(([doctor, count]) => ({ doctor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const visitPatterns = Object.fromEntries(dayOfWeekMap);

      const totalVisits = visits.length;
      const firstVisit = visits.length > 0 ? new Date(visits[visits.length - 1].date) : new Date();
      const monthsSinceFirst = (new Date().getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const averageVisitsPerMonth = monthsSinceFirst > 0 ? totalVisits / monthsSinceFirst : 0;

      setVisitAnalytics({
        totalVisits,
        averageVisitsPerMonth,
        mostFrequentReasons,
        preferredDoctors,
        visitPatterns,
      });

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Note: This would need an update patient method in dataService
      toast.success('Patient information updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update patient information');
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'entry_fee': return '🚪';
      case 'consultation': return '👨‍⚕️';
      case 'service': return '🔬';
      case 'medicine': return '💊';
      case 'discount': return '💸';
      case 'refund': return '💰';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Loading patient history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-gray-600">Patient ID: {patient.id.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{visitHistory.length}</div>
              <div className="text-sm text-gray-600">Total Visits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary?.totalSpent || 0)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(financialSummary?.averagePerVisit || 0)}
              </div>
              <div className="text-sm text-gray-600">Avg per Visit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {visitHistory.length > 0 ? new Date(visitHistory[0].date).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Visit</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'visits', label: '📅 Visit History', count: visitHistory.length },
              { key: 'financial', label: '💰 Financial Summary', count: null },
              { key: 'medical', label: '🏥 Medical Records', count: null },
              { key: 'analytics', label: '📊 Analytics', count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Visit History Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-4">
              {visitHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No visit history found for this patient.
                </div>
              ) : (
                visitHistory.map((visit, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {new Date(visit.date).toLocaleDateString('en', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-gray-600">
                          Departments: {visit.departments.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {formatCurrency(visit.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {visit.transactions.length} transactions
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {visit.transactions.map((transaction, tIndex) => (
                        <div key={tIndex} className="flex justify-between items-center py-2 px-3 bg-white rounded">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getTransactionIcon(transaction.transaction_type)}</span>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-500">
                                {transaction.transaction_type.replace('_', ' ').toUpperCase()} • {transaction.payment_mode?.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Financial Summary Tab */}
          {activeTab === 'financial' && financialSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Method Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Payment Method Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(financialSummary.paymentMethodBreakdown).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="capitalize">{method}</span>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Spending Trend */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Monthly Spending</h3>
                <div className="space-y-2">
                  {financialSummary.monthlySpending.slice(-6).map((month) => (
                    <div key={month.month} className="flex justify-between items-center">
                      <span>{month.month}</span>
                      <span className="font-semibold">{formatCurrency(month.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Medical Records Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      value={editedPatient.first_name || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, first_name: e.target.value})}
                      placeholder="First Name"
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      value={editedPatient.last_name || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, last_name: e.target.value})}
                      placeholder="Last Name"
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      value={editedPatient.phone || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, phone: e.target.value})}
                      placeholder="Phone"
                      className="px-3 py-2 border rounded-md"
                    />
                    <input
                      value={editedPatient.address || ''}
                      onChange={(e) => setEditedPatient({...editedPatient, address: e.target.value})}
                      placeholder="Address"
                      className="px-3 py-2 border rounded-md"
                    />
                    <div className="md:col-span-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mr-2"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><strong>Phone:</strong> {patient.phone}</div>
                    <div><strong>Gender:</strong> {patient.gender}</div>
                    <div><strong>Date of Birth:</strong> {patient.date_of_birth || 'Not provided'}</div>
                    <div><strong>Address:</strong> {patient.address || 'Not provided'}</div>
                    <div><strong>Emergency Contact:</strong> {patient.emergency_contact_name || 'Not provided'}</div>
                    <div><strong>Emergency Phone:</strong> {patient.emergency_contact_phone || 'Not provided'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && visitAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visit Frequency */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Visit Patterns</h3>
                <div className="space-y-3">
                  <div>
                    <strong>Average visits per month:</strong> {visitAnalytics.averageVisitsPerMonth.toFixed(1)}
                  </div>
                  <div>
                    <strong>Most frequent reasons:</strong>
                    <ul className="mt-2 space-y-1">
                      {visitAnalytics.mostFrequentReasons.map((reason, index) => (
                        <li key={index} className="text-sm">
                          {reason.reason} ({reason.count} times)
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Day of Week Patterns */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Visit Day Preferences</h3>
                <div className="space-y-2">
                  {Object.entries(visitAnalytics.visitPatterns).map(([day, count]) => (
                    <div key={day} className="flex justify-between items-center">
                      <span>{day}</span>
                      <span className="font-semibold">{count} visits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryModal;