import React, { useState, useEffect } from 'react';
import { medicineService } from '../services/medicineService';
import MedicineDropdown from './MedicineDropdown';

// Simple test component to verify medicine functionality
const MedicineTestComponent: React.FC = () => {
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [medicineCount, setMedicineCount] = useState(0);

  useEffect(() => {
    const loadMedicineCount = async () => {
      try {
        const medicines = await medicineService.getMedicines();
        setMedicineCount(medicines.length);
      } catch (error) {
        console.error('Error loading medicines:', error);
      }
    };
    loadMedicineCount();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Medicine Dropdown Test</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">Total medicines in database: <span className="font-bold">{medicineCount}</span></p>
      </div>

      <MedicineDropdown
        selectedMedicines={selectedMedicines}
        onChange={setSelectedMedicines}
        placeholder="Test medicine selection..."
        label="Test Medicine Selection"
      />

      {selectedMedicines.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Selected Medicines:</h3>
          <ul className="list-disc list-inside space-y-1">
            {selectedMedicines.map((medicine, index) => (
              <li key={index} className="text-gray-700">{medicine}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MedicineTestComponent;