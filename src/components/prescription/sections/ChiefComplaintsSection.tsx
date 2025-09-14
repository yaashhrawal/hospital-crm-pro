import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { CHIEF_COMPLAINTS, type ChiefComplaintData, DEFAULT_CHIEF_COMPLAINT } from '../../../data/medicalData';
import DoctorService from '../../../services/doctorService';
import NurseService from '../../../services/nurseService';

interface ChiefComplaintsSectionProps {
  data: ChiefComplaintData[];
  onChange: (data: ChiefComplaintData[]) => void;
}

const ChiefComplaintsSection: React.FC<ChiefComplaintsSectionProps> = ({ data, onChange }) => {
  const [currentComplaint, setCurrentComplaint] = useState<ChiefComplaintData>(DEFAULT_CHIEF_COMPLAINT);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showCustomComplaint, setShowCustomComplaint] = useState(false);
  const [customComplaint, setCustomComplaint] = useState('');

  const doctors = DoctorService.getAllDoctors();
  const nurses = NurseService.getAllNurses();

  const handleAddComplaint = () => {
    if (!currentComplaint.complaint || !currentComplaint.period) {
      alert('Please fill complaint and period');
      return;
    }

    if (isEditing && editIndex !== null) {
      // Update existing entry
      const updatedData = [...data];
      updatedData[editIndex] = currentComplaint;
      onChange(updatedData);
      setIsEditing(false);
      setEditIndex(null);
    } else {
      // Add new entry
      onChange([...data, currentComplaint]);
    }

    // Reset form
    setCurrentComplaint(DEFAULT_CHIEF_COMPLAINT);
  };

  const handleEdit = (index: number) => {
    setCurrentComplaint(data[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const handleReset = () => {
    setCurrentComplaint(DEFAULT_CHIEF_COMPLAINT);
    setIsEditing(false);
    setEditIndex(null);
  };

  const handleAddCustomComplaint = () => {
    if (customComplaint.trim()) {
      setCurrentComplaint({ ...currentComplaint, complaint: customComplaint.trim() });
      setCustomComplaint('');
      setShowCustomComplaint(false);
    }
  };

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          2. Chief Complaints Section
        </h3>

        <div className="space-y-4">
          {/* Complaint Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaint *
            </label>
            {!showCustomComplaint ? (
              <div className="space-y-2">
                <select
                  value={currentComplaint.complaint}
                  onChange={(e) => setCurrentComplaint({ ...currentComplaint, complaint: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Chief Complaint...</option>
                  {CHIEF_COMPLAINTS.map((complaint) => (
                    <option key={complaint} value={complaint}>
                      {complaint}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCustomComplaint(true)}
                  className="text-blue-600"
                >
                  + Add Custom Complaint
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customComplaint}
                  onChange={(e) => setCustomComplaint(e.target.value)}
                  placeholder="Enter custom complaint..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button size="sm" onClick={handleAddCustomComplaint}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowCustomComplaint(false);
                    setCustomComplaint('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Period Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="text"
              label="Period *"
              value={currentComplaint.period}
              onChange={(e) => setCurrentComplaint({ ...currentComplaint, period: e.target.value })}
              placeholder="e.g., 3 days, 1 week, 2 months"
              required
            />
          </div>

          {/* Present History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Present History
            </label>
            <textarea
              value={currentComplaint.presentHistory}
              onChange={(e) => setCurrentComplaint({ ...currentComplaint, presentHistory: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed present history of the complaint..."
            />
          </div>

          {/* Performing Doctor and Nurse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performing Doctor
              </label>
              <select
                value={currentComplaint.performingDoctor}
                onChange={(e) => setCurrentComplaint({ ...currentComplaint, performingDoctor: e.target.value })}
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
                Performing Nurse
              </label>
              <select
                value={currentComplaint.performingNurse}
                onChange={(e) => setCurrentComplaint({ ...currentComplaint, performingNurse: e.target.value })}
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
              Notes (Multi-line)
            </label>
            <textarea
              value={currentComplaint.notes}
              onChange={(e) => setCurrentComplaint({ ...currentComplaint, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddComplaint}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? 'Update Complaint' : 'Add Complaint'}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
            >
              Reset
            </Button>
          </div>

          {/* Display Added Complaints */}
          {data.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Added Chief Complaints:</h4>
              <div className="space-y-3">
                {data.map((complaint, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="font-medium text-blue-800">
                            {complaint.complaint}
                          </div>
                          <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            Period: {complaint.period}
                          </div>
                        </div>
                        
                        {complaint.presentHistory && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Present History:</strong> {complaint.presentHistory}
                          </div>
                        )}
                        
                        <div className="flex gap-4 text-sm text-gray-600">
                          {complaint.performingDoctor && (
                            <span><strong>Doctor:</strong> {complaint.performingDoctor}</span>
                          )}
                          {complaint.performingNurse && (
                            <span><strong>Nurse:</strong> {complaint.performingNurse}</span>
                          )}
                        </div>
                        
                        {complaint.notes && (
                          <div className="text-sm text-gray-700 mt-2">
                            <strong>Notes:</strong> {complaint.notes}
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

export default ChiefComplaintsSection;