import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { EXAMINATION_TYPES, SEVERITY_LEVELS, type ExaminationData, DEFAULT_EXAMINATION } from '../../../data/medicalData';
import DoctorService from '../../../services/doctorService';
import NurseService from '../../../services/nurseService';

interface ExaminationSectionProps {
  data: ExaminationData[];
  onChange: (data: ExaminationData[]) => void;
}

const ExaminationSection: React.FC<ExaminationSectionProps> = ({ data, onChange }) => {
  const [currentExamination, setCurrentExamination] = useState<ExaminationData>(DEFAULT_EXAMINATION);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const doctors = DoctorService.getAllDoctors();
  const nurses = NurseService.getAllNurses();

  const handleAddExamination = () => {
    if (!currentExamination.examination) {
      alert('Please select examination type');
      return;
    }

    if (isEditing && editIndex !== null) {
      // Update existing entry
      const updatedData = [...data];
      updatedData[editIndex] = currentExamination;
      onChange(updatedData);
      setIsEditing(false);
      setEditIndex(null);
    } else {
      // Add new entry
      onChange([...data, currentExamination]);
    }

    // Reset form
    setCurrentExamination(DEFAULT_EXAMINATION);
  };

  const handleEdit = (index: number) => {
    setCurrentExamination(data[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const handleReset = () => {
    setCurrentExamination(DEFAULT_EXAMINATION);
    setIsEditing(false);
    setEditIndex(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          4. Examination Section
        </h3>

        <div className="space-y-4">
          {/* Examination Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Examination Type *
            </label>
            <select
              value={currentExamination.examination}
              onChange={(e) => setCurrentExamination({ ...currentExamination, examination: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Examination...</option>
              {EXAMINATION_TYPES.map((examination) => (
                <option key={examination} value={examination}>
                  {examination}
                </option>
              ))}
            </select>
          </div>

          {/* Problem Since and Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Problem Since"
              value={currentExamination.problemSince}
              onChange={(e) => setCurrentExamination({ ...currentExamination, problemSince: e.target.value })}
              placeholder="e.g., 2 days ago, 1 week, 3 months"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={currentExamination.severity}
                onChange={(e) => setCurrentExamination({ ...currentExamination, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Severity...</option>
                {SEVERITY_LEVELS.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor and Nurse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={currentExamination.doctor}
                onChange={(e) => setCurrentExamination({ ...currentExamination, doctor: e.target.value })}
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
                value={currentExamination.nurse}
                onChange={(e) => setCurrentExamination({ ...currentExamination, nurse: e.target.value })}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={currentExamination.notes}
              onChange={(e) => setCurrentExamination({ ...currentExamination, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed examination findings and observations..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddExamination}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? 'Update Examination' : 'Add Examination'}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
            >
              Reset
            </Button>
          </div>

          {/* Display Added Examinations */}
          {data.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Added Examinations:</h4>
              <div className="space-y-3">
                {data.map((examination, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          <div className="font-medium text-purple-800">
                            {examination.examination}
                          </div>
                          {examination.severity && (
                            <span className={`px-2 py-1 rounded text-sm font-medium border ${getSeverityColor(examination.severity)}`}>
                              {examination.severity} Severity
                            </span>
                          )}
                          {examination.problemSince && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              Since: {examination.problemSince}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-4 text-sm text-gray-600 mb-2">
                          {examination.doctor && (
                            <span><strong>Doctor:</strong> {examination.doctor}</span>
                          )}
                          {examination.nurse && (
                            <span><strong>Nurse:</strong> {examination.nurse}</span>
                          )}
                        </div>
                        
                        {examination.notes && (
                          <div className="text-sm text-gray-700 mt-2">
                            <strong>Notes:</strong> {examination.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(index)}
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
      </div>
    </Card>
  );
};

export default ExaminationSection;