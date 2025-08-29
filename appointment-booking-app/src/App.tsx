import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Calendar, Users, Clock } from 'lucide-react';
import { PatientSelector } from './components/PatientSelector';
import type { PatientSearchResult } from './services/patientService';

function App() {
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);

  const handlePatientSelect = (patient: PatientSearchResult | null) => {
    setSelectedPatient(patient);
    console.log('Selected patient:', patient);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Appointment Booking
                </h1>
                <p className="text-sm text-gray-500">
                  Hospital Staff Portal
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Staff Portal</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Patient Selection */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Select Patient
              </h2>
              <PatientSelector
                onPatientSelect={handlePatientSelect}
                selectedPatient={selectedPatient}
                placeholder="Search patients by name, phone, or patient ID..."
              />
              
              {selectedPatient && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-2">
                    Patient Selected Successfully
                  </h3>
                  <div className="text-sm text-green-700">
                    <p><strong>Name:</strong> {selectedPatient.first_name} {selectedPatient.last_name}</p>
                    <p><strong>ID:</strong> {selectedPatient.patient_id}</p>
                    <p><strong>Phone:</strong> {selectedPatient.phone}</p>
                    <p><strong>Age:</strong> {selectedPatient.age || 'N/A'}</p>
                    <p><strong>Gender:</strong> {selectedPatient.gender}</p>
                    {selectedPatient.doctor_name && (
                      <p><strong>Doctor:</strong> Dr. {selectedPatient.doctor_name}</p>
                    )}
                    {selectedPatient.department_name && (
                      <p><strong>Department:</strong> {selectedPatient.department_name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Booking Form (Placeholder) */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Book Appointment
              </h2>
              
              {!selectedPatient ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    Select a patient to book an appointment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient
                    </label>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                      <br />
                      <span className="text-gray-500">{selectedPatient.patient_id}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Date
                    </label>
                    <input 
                      type="date" 
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Appointment Time
                    </label>
                    <select className="input-field">
                      <option value="">Select time slot</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Visit
                    </label>
                    <textarea 
                      className="input-field"
                      rows={3}
                      placeholder="Enter reason for appointment..."
                    />
                  </div>
                  
                  <button 
                    className="btn-primary w-full"
                    disabled={true}
                  >
                    Book Appointment (Coming Soon)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8">
          <div className="card p-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connected to Hospital CRM Database</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;