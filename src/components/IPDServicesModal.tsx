import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

interface IPDService {
  id: string;
  admission_id: string;
  service_name: string;
  service_type: 'NURSING' | 'MEDICATION' | 'PROCEDURE' | 'CONSULTATION' | 'DIAGNOSTIC' | 'OTHER';
  amount: number;
  service_date: string;
  notes?: string;
  provided_by?: string;
  created_at: string;
}

interface IPDServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  patientName: string;
}

const IPDServicesModal: React.FC<IPDServicesModalProps> = ({
  isOpen,
  onClose,
  admissionId,
  patientName
}) => {
  const [services, setServices] = useState<IPDService[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    service_type: 'NURSING' as 'NURSING' | 'MEDICATION' | 'PROCEDURE' | 'CONSULTATION' | 'DIAGNOSTIC' | 'OTHER',
    amount: '',
    service_date: new Date().toISOString().split('T')[0],
    notes: '',
    provided_by: '',
  });

  useEffect(() => {
    if (isOpen && admissionId) {
      loadServices();
    }
  }, [isOpen, admissionId]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ipd_services')
        .select('*')
        .eq('admission_id', admissionId)
        .order('service_date', { ascending: false });

      if (error) {
        console.error('Error loading services:', error);
        toast.error('Failed to load services');
        return;
      }

      setServices(data || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error(`Failed to load services: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_name || !formData.amount) {
      toast.error('Please fill in service name and amount');
      return;
    }

    try {
      const currentUser = await HospitalService.getCurrentUser();
      if (!currentUser) {
        toast.error('Authentication required');
        return;
      }

      const serviceData = {
        admission_id: admissionId,
        service_name: formData.service_name,
        service_type: formData.service_type,
        amount: parseFloat(formData.amount),
        service_date: formData.service_date,
        notes: formData.notes || null,
        provided_by: formData.provided_by || null,
        created_by: currentUser.id
      };

      const { error } = await supabase
        .from('ipd_services')
        .insert([serviceData]);

      if (error) {
        console.error('Error adding service:', error);
        toast.error('Failed to add service');
        return;
      }

      toast.success('Service added successfully');
      setFormData({
        service_name: '',
        service_type: 'NURSING',
        amount: '',
        service_date: new Date().toISOString().split('T')[0],
        notes: '',
        provided_by: '',
      });
      setShowAddForm(false);
      loadServices();
    } catch (error: any) {
      console.error('Error adding service:', error);
      toast.error(`Failed to add service: ${error.message}`);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('ipd_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting service:', error);
        toast.error('Failed to delete service');
        return;
      }

      toast.success('Service deleted successfully');
      loadServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(`Failed to delete service: ${error.message}`);
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'NURSING': return '👩‍⚕️';
      case 'MEDICATION': return '💊';
      case 'PROCEDURE': return '🏥';
      case 'CONSULTATION': return '👨‍⚕️';
      case 'DIAGNOSTIC': return '🔬';
      case 'OTHER': return '📋';
      default: return '📋';
    }
  };

  const totalServicesCost = services.reduce((sum, service) => sum + service.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">💊 IPD Services</h2>
            <p className="text-gray-600">Patient: {patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{services.length}</div>
            <div className="text-blue-600 text-sm">Total Services</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <div className="text-2xl font-bold text-green-700">₹{totalServicesCost.toLocaleString()}</div>
            <div className="text-green-600 text-sm">Total Services Cost</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {services.filter(s => s.service_date === new Date().toISOString().split('T')[0]).length}
            </div>
            <div className="text-purple-600 text-sm">Today's Services</div>
          </div>
        </div>

        {/* Add Service Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add New Service</span>
          </button>
        </div>

        {/* Add Service Form */}
        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
            <h3 className="text-lg font-semibold mb-4">Add New Service</h3>
            <form onSubmit={handleAddService} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Blood Test, X-Ray, Nursing Care"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type *
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="NURSING">👩‍⚕️ Nursing</option>
                    <option value="MEDICATION">💊 Medication</option>
                    <option value="PROCEDURE">🏥 Procedure</option>
                    <option value="CONSULTATION">👨‍⚕️ Consultation</option>
                    <option value="DIAGNOSTIC">🔬 Diagnostic</option>
                    <option value="OTHER">📋 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter service amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Date *
                  </label>
                  <input
                    type="date"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provided By
                  </label>
                  <input
                    type="text"
                    value={formData.provided_by}
                    onChange={(e) => setFormData({ ...formData, provided_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doctor/Nurse name"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes about the service"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading services...</p>
            </div>
          ) : services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Service</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Provided By</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Notes</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service, index) => (
                    <tr key={service.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="p-4 font-medium">{service.service_name}</td>
                      <td className="p-4">
                        <span className="flex items-center space-x-1">
                          <span>{getServiceTypeIcon(service.service_type)}</span>
                          <span className="text-sm">{service.service_type}</span>
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-green-600">₹{service.amount.toLocaleString()}</td>
                      <td className="p-4">{new Date(service.service_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm">{service.provided_by || '-'}</td>
                      <td className="p-4 text-sm max-w-xs truncate">{service.notes || '-'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services recorded</h3>
              <p className="text-gray-500 mb-4">No services have been provided to this patient yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Add First Service
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IPDServicesModal;