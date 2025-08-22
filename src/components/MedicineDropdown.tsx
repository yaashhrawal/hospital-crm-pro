import React, { useState, useEffect } from 'react';
import { medicineService, type Medicine } from '../services/medicineService';
import toast from 'react-hot-toast';

interface MedicineDropdownProps {
  selectedMedicines: string[];
  onChange: (medicines: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

const MedicineDropdown: React.FC<MedicineDropdownProps> = ({
  selectedMedicines = [],
  onChange,
  placeholder = 'Select Medicine...',
  className = '',
  disabled = false,
  label = 'Medicine'
}) => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newMedicine, setNewMedicine] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load all medicines on component mount
  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const allMedicines = await medicineService.getMedicines();
      setMedicines(allMedicines);
    } catch (error) {
      console.error('Error loading medicines:', error);
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  // Filter medicines based on search term
  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedMedicines.includes(medicine.name)
  );

  const handleMedicineSelect = async (medicineName: string) => {
    if (!selectedMedicines.includes(medicineName)) {
      const updatedMedicines = [...selectedMedicines, medicineName];
      onChange(updatedMedicines);

      // Increment usage count
      const medicine = medicines.find(m => m.name === medicineName);
      if (medicine) {
        try {
          await medicineService.incrementUsageCount(medicine.id);
          // Refresh medicines to update usage count
          loadMedicines();
        } catch (error) {
          // Ignore usage count update errors
        }
      }
    }
    setSearchTerm('');
  };

  const handleAddCustomMedicine = async () => {
    if (!newMedicine.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }

    try {
      const medicineName = newMedicine.trim();
      
      // Check if medicine already exists
      const existingMedicine = medicines.find(med => 
        med.name.toLowerCase() === medicineName.toLowerCase()
      );
      
      if (existingMedicine) {
        // Add to selected if not already there
        if (!selectedMedicines.includes(existingMedicine.name)) {
          const updatedMedicines = [...selectedMedicines, existingMedicine.name];
          onChange(updatedMedicines);
          
          // Increment usage count
          await medicineService.incrementUsageCount(existingMedicine.id);
          loadMedicines();
        }
        setNewMedicine('');
        setShowCustomInput(false);
        toast.success('Medicine added to prescription!');
        return;
      }

      // Create new custom medicine
      const newMed = await medicineService.createMedicine({
        name: medicineName,
        category: 'custom',
        is_custom: true
      });

      // Add to medicines list
      setMedicines(prev => [...prev, newMed]);

      // Add to selected medicines
      const updatedMedicines = [...selectedMedicines, newMed.name];
      onChange(updatedMedicines);

      // Clear input and hide
      setNewMedicine('');
      setShowCustomInput(false);
      
      toast.success('Custom medicine added and saved!');
    } catch (error) {
      console.error('Failed to add custom medicine:', error);
      toast.error('Failed to add custom medicine');
    }
  };

  const handleRemoveMedicine = (medicineToRemove: string) => {
    const updatedMedicines = selectedMedicines.filter(med => med !== medicineToRemove);
    onChange(updatedMedicines);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCustomInput) {
        handleAddCustomMedicine();
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-md font-medium text-gray-700 mb-2">{label}</label>
      )}
      
      {/* Medicine Selection Dropdown */}
      <div className="space-y-2">
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleMedicineSelect(e.target.value);
              e.target.value = '';
            }
          }}
          disabled={disabled || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">{loading ? 'Loading medicines...' : placeholder}</option>
          
          {/* Popular Medicines */}
          {filteredMedicines.length > 0 && (
            <>
              <optgroup label="Popular Medicines">
                {filteredMedicines
                  .filter(med => med.usage_count > 0)
                  .sort((a, b) => b.usage_count - a.usage_count)
                  .slice(0, 10)
                  .map(medicine => (
                    <option key={medicine.id} value={medicine.name}>
                      {medicine.name} 
                      {medicine.strength && ` - ${medicine.strength}`}
                      {medicine.dosage_form && ` (${medicine.dosage_form})`}
                      {medicine.is_custom && ' [Custom]'}
                    </option>
                  ))
                }
              </optgroup>
              
              {/* All Medicines by Category */}
              {['analgesic', 'antibiotic', 'antacid', 'vitamin', 'respiratory', 'antidiabetic', 'antihypertensive'].map(category => {
                const categoryMeds = filteredMedicines.filter(med => med.category === category);
                if (categoryMeds.length === 0) return null;
                
                return (
                  <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {categoryMeds
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(medicine => (
                        <option key={medicine.id} value={medicine.name}>
                          {medicine.name}
                          {medicine.strength && ` - ${medicine.strength}`}
                          {medicine.dosage_form && ` (${medicine.dosage_form})`}
                          {medicine.is_custom && ' [Custom]'}
                        </option>
                      ))
                    }
                  </optgroup>
                );
              })}
              
              {/* Other Medicines */}
              {(() => {
                const otherMeds = filteredMedicines.filter(med => 
                  !['analgesic', 'antibiotic', 'antacid', 'vitamin', 'respiratory', 'antidiabetic', 'antihypertensive'].includes(med.category)
                );
                if (otherMeds.length === 0) return null;
                
                return (
                  <optgroup label="Other Medicines">
                    {otherMeds
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(medicine => (
                        <option key={medicine.id} value={medicine.name}>
                          {medicine.name}
                          {medicine.strength && ` - ${medicine.strength}`}
                          {medicine.dosage_form && ` (${medicine.dosage_form})`}
                          {medicine.is_custom && ' [Custom]'}
                        </option>
                      ))
                    }
                  </optgroup>
                );
              })()}
            </>
          )}
        </select>

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search medicines..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        
        {/* Show filtered results when searching */}
        {searchTerm && filteredMedicines.length > 0 && (
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
            {filteredMedicines.slice(0, 10).map(medicine => (
              <div
                key={medicine.id}
                onClick={() => handleMedicineSelect(medicine.name)}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{medicine.name}</div>
                {(medicine.strength || medicine.dosage_form) && (
                  <div className="text-sm text-gray-500">
                    {medicine.strength && `${medicine.strength} `}
                    {medicine.dosage_form && `(${medicine.dosage_form})`}
                    {medicine.is_custom && ' - Custom Entry'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Add Custom Medicine Button */}
        <div className="mt-2">
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              disabled={disabled}
            >
              <span>+</span> Add Custom Medicine
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newMedicine}
                onChange={(e) => setNewMedicine(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter custom medicine name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                disabled={disabled}
              />
              <button
                onClick={handleAddCustomMedicine}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
                disabled={disabled}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setNewMedicine('');
                }}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                disabled={disabled}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selected Medicines */}
      {selectedMedicines.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-600 mb-2">Selected Medicines:</div>
          <div className="flex flex-wrap gap-2">
            {selectedMedicines.map((medicine, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
              >
                <span>{medicine}</span>
                <button
                  onClick={() => handleRemoveMedicine(medicine)}
                  className="text-blue-600 hover:text-blue-800 font-bold ml-1"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineDropdown;