import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { INVESTIGATION_SERVICES, type InvestigationData, DEFAULT_INVESTIGATION } from '../../../data/medicalData';
import DoctorService from '../../../services/doctorService';
import NurseService from '../../../services/nurseService';

interface InvestigationSectionProps {
  data: InvestigationData[];
  onChange: (data: InvestigationData[]) => void;
}

const InvestigationSection: React.FC<InvestigationSectionProps> = ({ data, onChange }) => {
  const [currentInvestigation, setCurrentInvestigation] = useState<InvestigationData>(DEFAULT_INVESTIGATION);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const doctors = DoctorService.getAllDoctors();
  const nurses = NurseService.getAllNurses();

  // Filter services based on search term
  const filteredServices = INVESTIGATION_SERVICES.filter(service =>
    service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddInvestigation = () => {
    if (!currentInvestigation.service) {
      alert('Please select investigation service');
      return;
    }

    if (isEditing && editIndex !== null) {
      // Update existing entry
      const updatedData = [...data];
      updatedData[editIndex] = currentInvestigation;
      onChange(updatedData);
      setIsEditing(false);
      setEditIndex(null);
    } else {
      // Add new entry
      onChange([...data, currentInvestigation]);
    }

    // Reset form
    setCurrentInvestigation(DEFAULT_INVESTIGATION);
    setSearchTerm('');
  };

  const handleEdit = (index: number) => {
    setCurrentInvestigation(data[index]);
    setIsEditing(true);
    setEditIndex(index);
  };

  const handleDelete = (index: number) => {
    const updatedData = data.filter((_, i) => i !== index);
    onChange(updatedData);
  };

  const handleReset = () => {
    setCurrentInvestigation(DEFAULT_INVESTIGATION);
    setIsEditing(false);
    setEditIndex(null);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleServiceSelect = (service: string) => {
    setCurrentInvestigation({ ...currentInvestigation, service });
    setSearchTerm(service);
    setShowSearchResults(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentInvestigation({ ...currentInvestigation, service: value });
    setShowSearchResults(value.length > 0);
  };

  return (
    <Card className="mb-6" padding="lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ color: '#0056B3' }}>
          5. Investigation Section
        </h3>

        <div className="space-y-4">
          {/* Searchable Service Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investigation Service *
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowSearchResults(searchTerm.length > 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for investigation service..."
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && filteredServices.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredServices.slice(0, 50).map((service, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    onClick={() => handleServiceSelect(service)}
                  >
                    {service}
                  </div>
                ))}
                {filteredServices.length > 50 && (
                  <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    ... and {filteredServices.length - 50} more results
                  </div>
                )}
              </div>
            )}

            {/* Fallback Dropdown */}
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSearchResults(!showSearchResults)}
              >
                {showSearchResults ? 'Hide Options' : 'Show All Options'}
              </Button>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Results
            </label>
            <textarea
              value={currentInvestigation.testResults}
              onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, testResults: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter test results and findings..."
            />
          </div>

          {/* Outside Test Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={currentInvestigation.outsideTest}
                onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, outsideTest: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Outside Test
              </span>
            </label>
            <span className="ml-2 text-sm text-gray-500">
              (Check if test was performed outside this facility)
            </span>
          </div>

          {/* Doctor and Nurse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor
              </label>
              <select
                value={currentInvestigation.doctor}
                onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, doctor: e.target.value })}
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
                value={currentInvestigation.nurse}
                onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, nurse: e.target.value })}
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
              value={currentInvestigation.notes}
              onChange={(e) => setCurrentInvestigation({ ...currentInvestigation, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about the investigation..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddInvestigation}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isEditing ? 'Update Investigation' : 'Add Investigation'}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
            >
              Reset
            </Button>
          </div>

          {/* Display Added Investigations */}
          {data.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Added Investigations:</h4>
              <div className="space-y-3">
                {data.map((investigation, index) => (
                  <div
                    key={index}
                    className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          <div className="font-medium text-indigo-800">
                            {investigation.service}
                          </div>
                          {investigation.outsideTest && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium border border-yellow-200">
                              Outside Test
                            </span>
                          )}
                        </div>
                        
                        {investigation.testResults && (
                          <div className="text-sm text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                            <strong>Test Results:</strong> {investigation.testResults}
                          </div>
                        )}
                        
                        <div className="flex gap-4 text-sm text-gray-600 mb-2">
                          {investigation.doctor && (
                            <span><strong>Doctor:</strong> {investigation.doctor}</span>
                          )}
                          {investigation.nurse && (
                            <span><strong>Nurse:</strong> {investigation.nurse}</span>
                          )}
                        </div>
                        
                        {investigation.notes && (
                          <div className="text-sm text-gray-700 mt-2">
                            <strong>Notes:</strong> {investigation.notes}
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

export default InvestigationSection;