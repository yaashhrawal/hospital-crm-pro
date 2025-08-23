import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';

const DatabaseSchemaChecker: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const checkSchema = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🔍 Checking database schema...');
      setResult('🔍 Checking database schema...\n');
      
      // Check if tables exist
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names');
        
      if (tablesError) {
        // Try alternative method
        const { data: doctorsTest } = await supabase
          .from('doctors')
          .select('*')
          .limit(1);
          
        const { data: departmentsTest } = await supabase
          .from('departments')
          .select('*')
          .limit(1);
          
        setResult(prev => prev + `Doctors table: ${doctorsTest !== null ? 'EXISTS' : 'NOT FOUND'}\n`);
        setResult(prev => prev + `Departments table: ${departmentsTest !== null ? 'EXISTS' : 'NOT FOUND'}\n`);
      }
      
      // Check column structure for doctors table
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .limit(1);
          
        if (data) {
          setResult(prev => prev + `✅ Doctors table exists with ${Object.keys(data[0] || {}).length} columns\n`);
          setResult(prev => prev + `Columns: ${Object.keys(data[0] || {}).join(', ')}\n\n`);
        }
      } catch (err) {
        setResult(prev => prev + `❌ Doctors table error: ${err}\n`);
      }
      
      // Check column structure for departments table
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .limit(1);
          
        if (data) {
          setResult(prev => prev + `✅ Departments table exists with ${Object.keys(data[0] || {}).length} columns\n`);
          setResult(prev => prev + `Columns: ${Object.keys(data[0] || {}).join(', ')}\n\n`);
        }
      } catch (err) {
        setResult(prev => prev + `❌ Departments table error: ${err}\n`);
      }
      
    } catch (error) {
      console.error('Schema check error:', error);
      setResult(prev => prev + `🚨 Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const createTables = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🏗️ Creating database tables...');
      setResult('🏗️ Creating database tables...\n');
      
      // Create departments table
      const createDepartmentsSQL = `
        CREATE TABLE IF NOT EXISTS departments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // Create doctors table  
      const createDoctorsSQL = `
        CREATE TABLE IF NOT EXISTS doctors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          department TEXT NOT NULL,
          specialization TEXT,
          fee NUMERIC(10,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // Execute table creation
      const { error: deptError } = await supabase.rpc('exec_sql', { sql: createDepartmentsSQL });
      const { error: doctorError } = await supabase.rpc('exec_sql', { sql: createDoctorsSQL });
      
      if (deptError) {
        setResult(prev => prev + `❌ Departments table creation failed: ${deptError.message}\n`);
      } else {
        setResult(prev => prev + `✅ Departments table created/verified\n`);
      }
      
      if (doctorError) {
        setResult(prev => prev + `❌ Doctors table creation failed: ${doctorError.message}\n`);
      } else {
        setResult(prev => prev + `✅ Doctors table created/verified\n`);
      }
      
      // Now try to add the data
      if (!deptError && !doctorError) {
        setResult(prev => prev + '\n🏥 Adding PHYSIOTHERAPY department...\n');
        
        const { data: deptData, error: deptInsertError } = await supabase
          .from('departments')
          .insert([{
            name: 'PHYSIOTHERAPY',
            description: 'Physiotherapy and Rehabilitation',
            is_active: true
          }])
          .select();
          
        if (deptInsertError) {
          setResult(prev => prev + `❌ Department insert error: ${deptInsertError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Department added successfully\n`);
        }
        
        setResult(prev => prev + '\n👩‍⚕️ Adding Dr. Poonam Jain...\n');
        
        const { data: doctorData, error: doctorInsertError } = await supabase
          .from('doctors')
          .insert([{
            name: 'DR. POONAM JAIN',
            department: 'PHYSIOTHERAPY',
            specialization: 'Physiotherapist',
            fee: 600.00,
            is_active: true
          }])
          .select();
          
        if (doctorInsertError) {
          setResult(prev => prev + `❌ Doctor insert error: ${doctorInsertError.message}\n`);
        } else {
          setResult(prev => prev + `✅ Doctor added successfully\n`);
        }
      }
      
    } catch (error) {
      console.error('Table creation error:', error);
      setResult(prev => prev + `🚨 Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-4xl">
      <h2 className="text-2xl font-bold mb-4">Database Schema Manager</h2>
      <p className="text-gray-600 mb-4">
        Check and fix database table structure issues.
      </p>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={checkSchema}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Checking...' : 'Check Schema'}
        </button>
        
        <button
          onClick={createTables}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Tables & Add Doctor'}
        </button>
      </div>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default DatabaseSchemaChecker;