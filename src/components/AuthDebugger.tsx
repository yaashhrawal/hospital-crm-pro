import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';

const AuthDebugger: React.FC = () => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check raw Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser();
      setAuthUser(user);
      console.log('Raw auth user:', user);

      // Check our service
      if (user) {
        const profileUser = await HospitalService.getCurrentUser();
        setProfileUser(profileUser);
        console.log('Profile user:', profileUser);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const testLogin = async () => {
    if (!testEmail || !testPassword) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Testing login with:', testEmail);
      
      // Test direct Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      console.log('Direct auth result:', { data, error });

      if (error) {
        toast.error(`Direct auth failed: ${error.message}`);
      } else if (data.user) {
        toast.success('Direct auth successful!');
        
        // Now test our service
        const serviceResult = await HospitalService.signIn(testEmail, testPassword);
        console.log('Service result:', serviceResult);
        
        if (serviceResult.error) {
          toast.error(`Service auth failed: ${serviceResult.error.message}`);
        } else if (serviceResult.user) {
          toast.success('Service auth successful!');
          await checkAuthStatus();
        }
      }
    } catch (error: any) {
      console.error('Test login error:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfileUser(null);
    toast.success('Signed out');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🔍 Authentication Debugger</h2>
      
      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Current Authentication Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Raw Supabase Auth User:</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {authUser ? JSON.stringify(authUser, null, 2) : 'Not authenticated'}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Profile User (from our service):</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {profileUser ? JSON.stringify(profileUser, null, 2) : 'No profile found'}
            </pre>
          </div>
        </div>
      </div>

      {/* Test Login */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test Login</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to test"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Password</label>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Enter password to test"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </button>
          
          <button
            onClick={checkAuthStatus}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Refresh Status
          </button>
          
          {authUser && (
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Connection Test */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Database Connection Test</h3>
        <button
          onClick={async () => {
            const result = await HospitalService.testConnection();
            console.log('Connection test:', result);
            toast.success(`Connection test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Test Database Connection
        </button>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">💡 Debugging Instructions</h3>
        <ol className="text-sm space-y-2">
          <li>1. Check if you have users in Supabase Auth dashboard</li>
          <li>2. Try logging in with existing user credentials above</li>
          <li>3. Check browser console for detailed error logs</li>
          <li>4. Verify your Supabase URL and anon key are correct</li>
          <li>5. Make sure your users table exists and has proper RLS policies</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthDebugger;