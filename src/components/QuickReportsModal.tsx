import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations, FutureAppointment } from '../config/supabaseNew';

interface QuickReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickReportsModal: React.FC<QuickReportsModalProps> = ({ isOpen, onClose }) => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [appointments, setAppointments] = useState<FutureAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen) {
      loadReportsData();
    }
  }, [isOpen, selectedDate]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [patientsData, appointmentsData] = await Promise.all([
        HospitalService.getPatients(100),
        HospitalService.getAppointments(100)
      ]);
      
      setPatients(patientsData);
      setAppointments(appointmentsData);
    } catch (error: any) {
      toast.error(`Failed to load reports data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilteredData = () => {
    const selectedDateObj = new Date(selectedDate);
    
    // Get patients registered on selected date
    const patientsOnDate = patients.filter(p => 
      new Date(p.created_at).toDateString() === selectedDateObj.toDateString()
    );
    
    // Get appointments on selected date
    const appointmentsOnDate = appointments.filter(a => 
      a.appointment_date === selectedDate
    );
    
    // Calculate revenue for the day
    const dailyRevenue = patientsOnDate.reduce((sum, patient) => {
      return sum + (patient.totalSpent || 0);
    }, 0);
    
    return {
      patientsOnDate,
      appointmentsOnDate,
      dailyRevenue
    };
  };

  if (!isOpen) return null;

  const { patientsOnDate, appointmentsOnDate, dailyRevenue } = getDateFilteredData();
  
  const totalPatients = patients.length;
  const totalRevenue = patients.reduce((sum, p) => sum + (p.totalSpent || 0), 0);
  const avgRevenuePerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📊 Quick Reports</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Date Filter */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Report Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadReportsData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">₹{dailyRevenue.toLocaleString()}</div>
                <div className="text-green-600 text-sm">Daily Revenue</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{patientsOnDate.length}</div>
                <div className="text-blue-600 text-sm">New Patients</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{appointmentsOnDate.length}</div>
                <div className="text-purple-600 text-sm">Appointments</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">₹{avgRevenuePerPatient.toLocaleString()}</div>
                <div className="text-orange-600 text-sm">Avg per Patient</div>
              </div>
            </div>

            {/* Overall Statistics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">📈 Overall Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xl font-bold text-gray-800">{totalPatients}</div>
                  <div className="text-gray-600 text-sm">Total Patients</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</div>
                  <div className="text-gray-600 text-sm">Total Revenue</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800">{appointments.length}</div>
                  <div className="text-gray-600 text-sm">Total Appointments</div>
                </div>
              </div>
            </div>

            {/* Daily Details */}
            {patientsOnDate.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">👥 Patients Registered on {new Date(selectedDate).toLocaleDateString()}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Patient</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-left p-2">Visits</th>
                        <th className="text-left p-2">Total Spent</th>
                        <th className="text-left p-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientsOnDate.map(patient => (
                        <tr key={patient.id} className="border-b">
                          <td className="p-2 font-medium">{patient.first_name} {patient.last_name}</td>
                          <td className="p-2">{patient.phone || 'N/A'}</td>
                          <td className="p-2">{patient.visitCount || 0}</td>
                          <td className="p-2 text-green-600 font-medium">₹{(patient.totalSpent || 0).toLocaleString()}</td>
                          <td className="p-2">{new Date(patient.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily Appointments */}
            {appointmentsOnDate.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">📅 Appointments on {new Date(selectedDate).toLocaleDateString()}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Patient</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointmentsOnDate.map(appointment => (
                        <tr key={appointment.id} className="border-b">
                          <td className="p-2 font-medium">{appointment.appointment_time}</td>
                          <td className="p-2">
                            {(appointment as any).patient?.first_name} {(appointment as any).patient?.last_name}
                          </td>
                          <td className="p-2">{appointment.appointment_type}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="p-2 text-green-600">₹{(appointment.estimated_cost || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {patientsOnDate.length === 0 && appointmentsOnDate.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600">No data found for {new Date(selectedDate).toLocaleDateString()}</p>
                <p className="text-gray-500 text-sm">Try selecting a different date</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickReportsModal;