import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import {
  TASK_INSTRUCTIONS,
  ADMISSION_TYPES,
  ADMISSION_MODES,
  INSURANCE_OPTIONS,
  COUNSELLING_TYPES,
  THERAPY_TYPES,
  INJECTION_TYPES,
  TREATMENT_TYPES,
  VACCINES,
  type TaskOrderData
} from '../../../data/medicalData';
import DoctorService from '../../../services/doctorService';
import NurseService from '../../../services/nurseService';

interface TaskOrderSectionProps {
  data: TaskOrderData[];
  onChange: (data: TaskOrderData[]) => void;
}

type TabType = 'instruction' | 'admission' | 'appointment' | 'counselling' | 'therapy' | 'injection' | 'treatment' | 'vaccination';

const TaskOrderSection: React.FC<TaskOrderSectionProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>('instruction');
  const [currentTask, setCurrentTask] = useState<TaskOrderData>({
    type: 'instruction',
    doctor: '',
    nurse: '',
    notes: ''
  });

  const doctors = DoctorService.getAllDoctors();
  const nurses = NurseService.getAllNurses();

  const tabs = [
    { id: 'instruction', label: 'Instruction', icon: '📋' },
    { id: 'admission', label: 'Refer to Admission', icon: '🏥' },
    { id: 'appointment', label: 'Refer to Appointment', icon: '📅' },
    { id: 'counselling', label: 'Counselling', icon: '💬' },
    { id: 'therapy', label: 'Therapy', icon: '🤲' },
    { id: 'injection', label: 'Injection', icon: '💉' },
    { id: 'treatment', label: 'Treatment', icon: '🔬' },
    { id: 'vaccination', label: 'Vaccination', icon: '🩹' }
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentTask({
      type: tab,
      doctor: '',
      nurse: '',
      notes: ''
    });
  };

  const handleAddTask = () => {
    // Validation based on tab type
    let isValid = true;
    let errorMessage = '';

    switch (activeTab) {
      case 'instruction':
        if (!currentTask.instruction) {
          isValid = false;
          errorMessage = 'Please select an instruction';
        }
        break;
      case 'admission':
        if (!currentTask.reason) {
          isValid = false;
          errorMessage = 'Please enter reason for admission';
        }
        break;
      case 'counselling':
        if (!currentTask.counsellorName || !currentTask.duration) {
          isValid = false;
          errorMessage = 'Please enter counsellor name and duration';
        }
        break;
      case 'injection':
        if (!currentTask.injectionType) {
          isValid = false;
          errorMessage = 'Please select injection type';
        }
        break;
      case 'vaccination':
        if (!currentTask.vaccineName) {
          isValid = false;
          errorMessage = 'Please enter vaccine name';
        }
        break;
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    onChange([...data, currentTask]);
    
    // Reset current task
    setCurrentTask({
      type: activeTab,
      doctor: '',
      nurse: '',
      notes: ''
    });
  };

  const handleDeleteTask = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'instruction':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Instruction *
              </label>
              <select
                value={currentTask.instruction || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, instruction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Instruction...</option>
                {TASK_INSTRUCTIONS.map((instruction) => (
                  <option key={instruction} value={instruction}>
                    {instruction}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'admission':
        return (
          <div className="space-y-4">
            <Input
              type="text"
              label="Reason for Admission *"
              value={currentTask.reason || ''}
              onChange={(e) => setCurrentTask({ ...currentTask, reason: e.target.value })}
              placeholder="Enter reason for admission"
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Admission Type
                </label>
                <div className="space-x-4">
                  {ADMISSION_TYPES.map((type) => (
                    <label key={type} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="admissionType"
                        value={type}
                        checked={currentTask.admissionType === type}
                        onChange={(e) => setCurrentTask({ ...currentTask, admissionType: e.target.value })}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Mode
                </label>
                <div className="space-x-4">
                  {ADMISSION_MODES.map((mode) => (
                    <label key={mode} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="admissionMode"
                        value={mode}
                        checked={currentTask.admissionMode === mode}
                        onChange={(e) => setCurrentTask({ ...currentTask, admissionMode: e.target.value })}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Doctor
                </label>
                <select
                  value={currentTask.specificDoctor || ''}
                  onChange={(e) => setCurrentTask({ ...currentTask, specificDoctor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.name}>
                      {doctor.name} - {doctor.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance
                </label>
                <div className="space-x-4">
                  {INSURANCE_OPTIONS.map((option) => (
                    <label key={option} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="insurance"
                        value={option}
                        checked={currentTask.insurance === option}
                        onChange={(e) => setCurrentTask({ ...currentTask, insurance: e.target.value })}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'counselling':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Counsellor Name *"
                value={currentTask.counsellorName || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, counsellorName: e.target.value })}
                placeholder="Enter counsellor name"
                required
              />
              <Input
                type="text"
                label="Duration *"
                value={currentTask.duration || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, duration: e.target.value })}
                placeholder="e.g., 30 minutes, 1 hour"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Counselling Type
              </label>
              <select
                value={currentTask.instruction || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, instruction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Counselling Type...</option>
                {COUNSELLING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'therapy':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Therapy Type
              </label>
              <select
                value={currentTask.instruction || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, instruction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Therapy Type...</option>
                {THERAPY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'injection':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Injection Type *
              </label>
              <select
                value={currentTask.injectionType || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, injectionType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Injection Type...</option>
                {INJECTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'treatment':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Type
              </label>
              <select
                value={currentTask.instruction || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, instruction: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Treatment Type...</option>
                {TREATMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'vaccination':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vaccine Name *
              </label>
              <select
                value={currentTask.vaccineName || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, vaccineName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Vaccine...</option>
                {VACCINES.map((vaccine) => (
                  <option key={vaccine} value={vaccine}>
                    {vaccine}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'appointment':
        return (
          <div className="space-y-4">
            <Input
              type="datetime-local"
              label="Appointment Date & Time"
              value={currentTask.duration || ''}
              onChange={(e) => setCurrentTask({ ...currentTask, duration: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment With Doctor
              </label>
              <select
                value={currentTask.specificDoctor || ''}
                onChange={(e) => setCurrentTask({ ...currentTask, specificDoctor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Doctor...</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.name}>
                    {doctor.name} - {doctor.department}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          3. Task Order Section
        </h3>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {renderTabContent()}
        </div>

        {/* Common Fields for All Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>
            <select
              value={currentTask.doctor}
              onChange={(e) => setCurrentTask({ ...currentTask, doctor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Doctor...</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.name}>
                  {doctor.name} - {doctor.department}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nurse
            </label>
            <select
              value={currentTask.nurse}
              onChange={(e) => setCurrentTask({ ...currentTask, nurse: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Nurse...</option>
              {nurses.map((nurse) => (
                <option key={nurse.id} value={nurse.name}>
                  {nurse.name} - {nurse.department}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={currentTask.notes}
            onChange={(e) => setCurrentTask({ ...currentTask, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddTask}
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add {tabs.find(t => t.id === activeTab)?.label}
          </Button>
        </div>

        {/* Display Added Tasks */}
        {data.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Added Tasks:</h4>
            <div className="space-y-3">
              {data.map((task, index) => (
                <div
                  key={index}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="bg-green-100 px-2 py-1 rounded text-sm font-medium text-green-800">
                          {tabs.find(t => t.id === task.type)?.label}
                        </span>
                        {task.instruction && <span className="text-sm text-gray-600">{task.instruction}</span>}
                        {task.reason && <span className="text-sm text-gray-600">Reason: {task.reason}</span>}
                        {task.injectionType && <span className="text-sm text-gray-600">{task.injectionType}</span>}
                        {task.vaccineName && <span className="text-sm text-gray-600">{task.vaccineName}</span>}
                      </div>
                      
                      <div className="flex gap-4 text-sm text-gray-600">
                        {task.doctor && <span><strong>Doctor:</strong> {task.doctor}</span>}
                        {task.nurse && <span><strong>Nurse:</strong> {task.nurse}</span>}
                      </div>
                      
                      {task.notes && (
                        <div className="text-sm text-gray-700 mt-2">
                          <strong>Notes:</strong> {task.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteTask(index)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskOrderSection;