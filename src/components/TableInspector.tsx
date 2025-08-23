import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';

const TableInspector: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const inspectTables = async () => {
    setLoading(true);
    setResult('');
    
    try {
      setResult('🔍 Inspecting patient assignment tables...\n\n');
      
      // Check patients table for assigned_doctor and assigned_department columns
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .limit(2);
        
      if (patientsData && patientsData.length > 0) {
        setResult(prev => prev + `✅ PATIENTS TABLE STRUCTURE:\n`);
        setResult(prev => prev + `Columns: ${Object.keys(patientsData[0]).join(', ')}\n\n`);
        
        // Check if assigned_doctor and assigned_department columns exist
        const hasAssignedDoctor = Object.keys(patientsData[0]).includes('assigned_doctor');
        const hasAssignedDept = Object.keys(patientsData[0]).includes('assigned_department');
        
        setResult(prev => prev + `🎯 KEY ASSIGNMENT COLUMNS:\n`);
        setResult(prev => prev + `assigned_doctor: ${hasAssignedDoctor ? '✅ EXISTS' : '❌ NOT FOUND'}\n`);
        setResult(prev => prev + `assigned_department: ${hasAssignedDept ? '✅ EXISTS' : '❌ NOT FOUND'}\n\n`);
        
        if (hasAssignedDoctor || hasAssignedDept) {
          setResult(prev => prev + `📋 SAMPLE PATIENT DATA:\n`);
          patientsData.forEach((patient, index) => {
            setResult(prev => prev + `Patient ${index + 1}:\n`);
            setResult(prev => prev + `  assigned_doctor: ${patient.assigned_doctor || 'NULL'}\n`);
            setResult(prev => prev + `  assigned_department: ${patient.assigned_department || 'NULL'}\n\n`);
          });
        }
      }
      
      // Also check what dataService.getDoctors() and getDepartments() actually return
      setResult(prev => prev + `🔧 TESTING dataService METHODS:\n`);
      
      try {
        // Import dataService dynamically
        const dataService = (await import('../services/dataService')).default;
        
        const doctors = await dataService.getDoctors();
        const departments = await dataService.getDepartments();
        
        setResult(prev => prev + `📊 getDoctors() returns ${doctors.length} doctors:\n`);
        doctors.forEach((doctor, index) => {
          setResult(prev => prev + `  ${index + 1}. ${doctor.name} (${doctor.department}) - Fee: ${doctor.fee}\n`);
        });
        
        setResult(prev => prev + `\n📊 getDepartments() returns ${departments.length} departments:\n`);
        departments.forEach((dept, index) => {
          setResult(prev => prev + `  ${index + 1}. ${dept.name} - ${dept.description}\n`);
        });
        
      } catch (err) {
        setResult(prev => prev + `❌ Error testing dataService methods: ${err}\n`);
      }
      
    } catch (error) {
      console.error('Inspection error:', error);
      setResult(prev => prev + `🚨 Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Patient Assignment Table Inspector</h2>
      <p className="text-gray-600 mb-4">
        Let's inspect which tables store doctor/department assignments for patients.
      </p>
      
      <button
        onClick={inspectTables}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Inspecting...' : 'Inspect Tables'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Inspection Results:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default TableInspector;