import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, Calendar } from 'lucide-react';
import { patientService, type PatientSearchResult } from '../services/patientService';

interface PatientSelectorProps {
  onPatientSelect: (patient: PatientSearchResult) => void;
  selectedPatient?: PatientSearchResult | null;
  placeholder?: string;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  onPatientSelect,
  selectedPatient,
  placeholder = "Search patients by name, phone, or ID..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [recentPatients, setRecentPatients] = useState<PatientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent patients on component mount
  useEffect(() => {
    loadRecentPatients();
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadRecentPatients = async () => {
    try {
      setIsLoadingRecent(true);
      const patients = await patientService.getRecentPatients(10);
      setRecentPatients(patients);
    } catch (error) {
      console.error('❌ Error loading recent patients:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (term.trim().length < 2) return;

    try {
      setIsSearching(true);
      const results = await patientService.searchPatients(term, 15);
      setSearchResults(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('❌ Error searching patients:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePatientSelect = (patient: PatientSearchResult) => {
    onPatientSelect(patient);
    setSearchTerm(`${patient.first_name} ${patient.last_name} (${patient.patient_id})`);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    if (!searchTerm && recentPatients.length > 0) {
      // Show recent patients when input is focused and empty
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value) {
      setSearchResults([]);
      onPatientSelect(null as any); // Clear selection
    }
  };

  const formatAge = (age: string | null) => {
    if (!age) return 'N/A';
    return age.includes('Y') ? age : `${age}Y`;
  };

  const formatGender = (gender: string) => {
    return gender === 'MALE' ? 'M' : gender === 'FEMALE' ? 'F' : 'O';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const PatientCard: React.FC<{ patient: PatientSearchResult; onClick: () => void }> = ({ patient, onClick }) => (
    <div 
      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {patient.first_name} {patient.last_name}
                </p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {patient.patient_id}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Phone className="w-3 h-3" />
                  <span>{patient.phone}</span>
                </div>
                <span>{formatAge(patient.age)} • {formatGender(patient.gender)}</span>
              </div>
            </div>
          </div>
          
          {(patient.doctor_name || patient.department_name) && (
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
              {patient.doctor_name && (
                <span>Dr. {patient.doctor_name}</span>
              )}
              {patient.department_name && (
                <span className="text-primary-600">{patient.department_name}</span>
              )}
            </div>
          )}
          
          {patient.last_appointment && (
            <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Last visit: {formatDate(patient.last_appointment.split(' ')[0])}</span>
              {patient.appointment_count && (
                <span className="ml-2 text-primary-600">({patient.appointment_count} visits)</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          className="input-field pl-10"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* Selected Patient Display */}
      {selectedPatient && !showDropdown && (
        <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-900">
                Selected: {selectedPatient.first_name} {selectedPatient.last_name}
              </p>
              <p className="text-xs text-primary-700">
                {selectedPatient.patient_id} • {selectedPatient.phone}
              </p>
            </div>
            <button
              onClick={() => {
                onPatientSelect(null as any);
                setSearchTerm('');
              }}
              className="text-primary-600 hover:text-primary-800 text-xs"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Search Results */}
          {searchTerm.trim().length >= 2 && (
            <div>
              <div className="p-3 bg-gray-50 border-b">
                <p className="text-xs font-medium text-gray-700">
                  Search Results {searchResults.length > 0 && `(${searchResults.length})`}
                </p>
              </div>
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onClick={() => handlePatientSelect(patient)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No patients found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching by name, phone number, or patient ID
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent Patients */}
          {(!searchTerm || searchTerm.trim().length < 2) && recentPatients.length > 0 && (
            <div>
              <div className="p-3 bg-gray-50 border-b">
                <p className="text-xs font-medium text-gray-700">Recent Patients</p>
              </div>
              {isLoadingRecent ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : (
                <div>
                  {recentPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onClick={() => handlePatientSelect(patient)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchTerm && recentPatients.length === 0 && !isLoadingRecent && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Start typing to search patients</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};