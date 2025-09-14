import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { DIAGNOSIS_OPTIONS, type DiagnosisData, DEFAULT_DIAGNOSIS } from '../../../data/medicalData';
import DoctorService from '../../../services/doctorService';
import NurseService from '../../../services/nurseService';

interface DiagnosisSectionProps {
  data: DiagnosisData[];
  onChange: (data: DiagnosisData[]) => void;
}

const DiagnosisSection: React.FC<DiagnosisSectionProps> = ({ data, onChange }) => {
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisData>(DEFAULT_DIAGNOSIS);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const doctors = DoctorService.getAllDoctors();
  const nurses = NurseService.getAllNurses();

  // Filter diagnoses based on search term
  const filteredDiagnoses = DIAGNOSIS_OPTIONS.filter(diagnosis =>
    diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDiagnosis = () => {
    if (!currentDiagnosis.diagnosis) {
      alert('Please select or enter diagnosis');
      return;
    }

    if (isEditing && editIndex !== null) {
      // Update existing entry
      const updatedData = [...data];
      updatedData[editIndex] = currentDiagnosis;
      onChange(updatedData);
      setIsEditing(false);
      setEditIndex(null);
    } else {
      // Add new entry
      onChange([...data, currentDiagnosis]);
    }

    // Reset form
    setCurrentDiagnosis(DEFAULT_DIAGNOSIS);
    setSearchTerm('');
  };

  const handleEdit = (index: number) => {
    setCurrentDiagnosis(data[index]);
    setIsEditing(true);
    setEditIndex(index);
    setSearchTerm(data[index].diagnosis);
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const handleReset = () => {
    setCurrentDiagnosis(DEFAULT_DIAGNOSIS);
    setIsEditing(false);
    setEditIndex(null);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleDiagnosisSelect = (diagnosis: string) => {
    setCurrentDiagnosis({ ...currentDiagnosis, diagnosis });
    setSearchTerm(diagnosis);
    setShowSearchResults(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentDiagnosis({ ...currentDiagnosis, diagnosis: value });
    setShowSearchResults(value.length > 0);
  };

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          6. Diagnosis Section
        </h3>

        <div className="space-y-4">
          {/* Searchable Diagnosis Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis *
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(searchTerm.length > 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for diagnosis or enter custom diagnosis..."
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && filteredDiagnoses.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredDiagnoses.slice(0, 30).map((diagnosis, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    onClick={() => handleDiagnosisSelect(diagnosis)}
                  >
                    {diagnosis}
                  </div>
                ))}
                {filteredDiagnoses.length > 30 && (
                  <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    ... and {filteredDiagnoses.length - 30} more results
                  </div>
                )}
              </div>
            )}

            {/* Show All Diagnoses Button */}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSearchResults(!showSearchResults)}
              >
                {showSearchResults ? 'Hide Options' : 'Show All Diagnoses'}
              </Button>
            </div>
          </div>

          {/* High Risk Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentDiagnosis.highRisk}
                onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, highRisk: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-red-700">
                High Risk Diagnosis
              </span>
            </label>
            <span className="ml-2 text-sm text-gray-500">
              (Check if this is a high-risk condition requiring special attention)
            </span>
          </div>

          {/* Doctor and Nurse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={currentDiagnosis.doctor}
                onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, doctor: e.target.value })}
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
                value={currentDiagnosis.nurse}
                onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, nurse: e.target.value })}
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

          {/* Treatment Given */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Given
            </label>
            <textarea
              value={currentDiagnosis.treatmentGiven}
              onChange={(e) => setCurrentDiagnosis({ ...currentDiagnosis, treatmentGiven: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the treatment provided for this diagnosis..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddDiagnosis}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? 'Update Diagnosis' : 'Add Diagnosis'}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
            >
              Reset
            </Button>
          </div>

          {/* Display Added Diagnoses */}
          {data.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Added Diagnoses:</h4>
              <div className="space-y-3">
                {data.map((diagnosis, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      diagnosis.highRisk 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-teal-50 border-teal-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          <div className={`font-medium ${
                            diagnosis.highRisk ? 'text-red-800' : 'text-teal-800'
                          }`}>
                            {diagnosis.diagnosis}
                          </div>
                          {diagnosis.highRisk && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium border border-red-300">
                              ⚠️ High Risk
                            </span>
                          )}
                        </div>
                        
                        {diagnosis.treatmentGiven && (
                          <div className="text-sm text-gray-700 mb-2 bg-white p-2 rounded border">
                            <strong>Treatment Given:</strong> {diagnosis.treatmentGiven}
                          </div>
                        )}
                        
                        <div className="flex gap-4 text-sm text-gray-600">
                          {diagnosis.doctor && (
                            <span><strong>Doctor:</strong> {diagnosis.doctor}</span>
                          )}
                          {diagnosis.nurse && (
                            <span><strong>Nurse:</strong> {diagnosis.nurse}</span>
                          )}
                        </div>
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

export default DiagnosisSection;