import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { HIGH_RISK_CONDITIONS, type HighRiskData, DEFAULT_HIGH_RISK } from '../../../data/medicalData';

interface HighRiskSectionProps {
  data: HighRiskData[];
  onChange: (data: HighRiskData[]) => void;
}

const HighRiskSection: React.FC<HighRiskSectionProps> = ({ data, onChange }) => {
  const [currentRisk, setCurrentRisk] = useState<HighRiskData>(DEFAULT_HIGH_RISK);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleAddHighRisk = () => {
    if (!currentRisk.condition || !currentRisk.identifiedDate) {
      alert('Please select condition and date');
      return;
    }

    if (isEditing && editIndex !== null) {
      // Update existing entry
      const updatedData = [...data];
      updatedData[editIndex] = currentRisk;
      onChange(updatedData);
      setIsEditing(false);
      setEditIndex(null);
    } else {
      // Add new entry
      onChange([...data, currentRisk]);
    }

    // Reset form
    setCurrentRisk(DEFAULT_HIGH_RISK);
  };

  const handleEdit = (index: number) => {
    setCurrentRisk(data[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const handleReset = () => {
    setCurrentRisk(DEFAULT_HIGH_RISK);
    setIsEditing(false);
    setEditIndex(null);
  };

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          1. High Risk Section
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* High Risk Condition Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              High Risk Condition *
            </label>
            <select
              value={currentRisk.condition}
              onChange={(e) => setCurrentRisk({ ...currentRisk, condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select High Risk Condition...</option>
              {HIGH_RISK_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          {/* Date Identified */}
          <div>
            <Input
              type="date"
              label="Date Identified *"
              value={currentRisk.identifiedDate}
              onChange={(e) => setCurrentRisk({ ...currentRisk, identifiedDate: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={currentRisk.notes || ''}
            onChange={(e) => setCurrentRisk({ ...currentRisk, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes about the high risk condition..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAddHighRisk}
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isEditing ? 'Update High Risk' : 'Add High Risk'}
          </Button>
          <Button
            onClick={handleReset}
            variant="secondary"
          >
            Reset
          </Button>
        </div>

        {/* Display Added High Risk Conditions */}
        {data.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Added High Risk Conditions:</h4>
            <div className="space-y-3">
              {data.map((risk, index) => (
                <div
                  key={index}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="font-medium text-red-800">
                          <span className="bg-red-100 px-2 py-1 rounded text-sm">
                            {risk.condition}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Identified: {new Date(risk.identifiedDate).toLocaleDateString()}
                        </div>
                      </div>
                      {risk.notes && (
                        <div className="text-sm text-gray-700 mt-2">
                          <strong>Notes:</strong> {risk.notes}
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
    </Card>
  );
};

export default HighRiskSection;