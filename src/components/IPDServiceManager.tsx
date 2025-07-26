import React, { useState, useEffect } from 'react';
import type { PatientWithRelations, PatientTransaction } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface IPDServiceManagerProps {
  patientAdmission: any; // IPD admission record
  isOpen: boolean;
  onClose: () => void;
  onServicesUpdated?: () => void;
}

interface IPDServiceItem {
  id?: string;
  name: string;
  category: 'ACCOMMODATION' | 'NURSING' | 'MEDICINE' | 'PROCEDURE' | 'DIAGNOSTIC' | 'THERAPY' | 'OTHER';
  price: number;
  quantity: number;
  date: string;
  notes?: string;
  transactionId?: string;
}

// IPD-specific medical services catalog
const IPD_SERVICES = [
  // Accommodation & Room Services
  { name: 'General Ward (per day)', category: 'ACCOMMODATION' as const, defaultPrice: 800 },
  { name: 'Private Room (per day)', category: 'ACCOMMODATION' as const, defaultPrice: 1500 },
  { name: 'ICU (per day)', category: 'ACCOMMODATION' as const, defaultPrice: 3000 },
  { name: 'Emergency Bed (per day)', category: 'ACCOMMODATION' as const, defaultPrice: 1200 },
  
  // Nursing Services
  { name: 'Nursing Care (per day)', category: 'NURSING' as const, defaultPrice: 500 },
  { name: 'Special Nursing Care', category: 'NURSING' as const, defaultPrice: 800 },
  { name: 'ICU Nursing (per day)', category: 'NURSING' as const, defaultPrice: 1000 },
  { name: 'Wound Dressing', category: 'NURSING' as const, defaultPrice: 200 },
  { name: 'Injection Administration', category: 'NURSING' as const, defaultPrice: 50 },
  
  // Medicines & IV
  { name: 'IV Fluids', category: 'MEDICINE' as const, defaultPrice: 200 },
  { name: 'Antibiotics', category: 'MEDICINE' as const, defaultPrice: 300 },
  { name: 'Pain Management', category: 'MEDICINE' as const, defaultPrice: 150 },
  { name: 'Blood Transfusion', category: 'MEDICINE' as const, defaultPrice: 2000 },
  
  // Procedures & Operations
  { name: 'Minor Surgery', category: 'PROCEDURE' as const, defaultPrice: 5000 },
  { name: 'Major Surgery', category: 'PROCEDURE' as const, defaultPrice: 25000 },
  { name: 'Endoscopy', category: 'PROCEDURE' as const, defaultPrice: 3000 },
  { name: 'Catheterization', category: 'PROCEDURE' as const, defaultPrice: 1500 },
  
  // Diagnostic Services
  { name: 'Daily Blood Test', category: 'DIAGNOSTIC' as const, defaultPrice: 300 },
  { name: 'X-Ray', category: 'DIAGNOSTIC' as const, defaultPrice: 400 },
  { name: 'CT Scan', category: 'DIAGNOSTIC' as const, defaultPrice: 4000 },
  { name: 'MRI', category: 'DIAGNOSTIC' as const, defaultPrice: 6000 },
  { name: 'ECG', category: 'DIAGNOSTIC' as const, defaultPrice: 200 },
  { name: 'Echo', category: 'DIAGNOSTIC' as const, defaultPrice: 1200 },
  
  // Therapy & Support
  { name: 'Physiotherapy Session', category: 'THERAPY' as const, defaultPrice: 500 },
  { name: 'Oxygen Therapy (per day)', category: 'THERAPY' as const, defaultPrice: 400 },
  { name: 'Nebulization', category: 'THERAPY' as const, defaultPrice: 200 },
  
  // Other Services
  { name: 'Ambulance Service', category: 'OTHER' as const, defaultPrice: 800 },
  { name: 'Medical Equipment Rental', category: 'OTHER' as const, defaultPrice: 300 },
  { name: 'Discharge Planning', category: 'OTHER' as const, defaultPrice: 200 },
];

const IPDServiceManager: React.FC<IPDServiceManagerProps> = ({
  patientAdmission,
  isOpen,
  onClose,
  onServicesUpdated
}) => {
  const [services, setServices] = useState<IPDServiceItem[]>([]);
  const [newService, setNewService] = useState<IPDServiceItem>({
    name: '',
    category: 'ACCOMMODATION',
    price: 0,
    quantity: 1,
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedCategory, setSelectedCategory] = useState<IPDServiceItem['category']>('ACCOMMODATION');
  const [isCustomService, setIsCustomService] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingTransactions, setExistingTransactions] = useState<PatientTransaction[]>([]);

  useEffect(() => {
    loadExistingServices();
  }, [patientAdmission.patient_id]);

  const loadExistingServices = async () => {
    try {
      setLoading(true);
      const transactions = await HospitalService.getTransactionsByPatient(patientAdmission.patient_id);
      
      // Filter IPD service-related transactions
      const ipdServiceTransactions = transactions.filter(t => 
        ['ACCOMMODATION', 'NURSING', 'MEDICINE', 'PROCEDURE', 'DIAGNOSTIC', 'THERAPY', 'OTHER'].includes(t.transaction_type) &&
        t.status === 'COMPLETED' &&
        // Only show transactions after admission date
        new Date(t.created_at) >= new Date(patientAdmission.admission_date)
      );
      
      setExistingTransactions(ipdServiceTransactions);
      
      // Convert transactions to service items
      const existingServices = ipdServiceTransactions.map(t => ({
        id: t.id,
        name: t.description || t.transaction_type,
        category: t.transaction_type as IPDServiceItem['category'],
        price: t.amount,
        quantity: 1,
        date: new Date(t.created_at).toISOString().split('T')[0],
        transactionId: t.id
      }));
      
      setServices(existingServices);
    } catch (error) {
      console.error('Error loading IPD services:', error);
      toast.error('Failed to load existing services');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredServices = () => {
    return IPD_SERVICES.filter(s => s.category === selectedCategory);
  };

  const handleServiceSelect = (serviceName: string) => {
    const selectedService = IPD_SERVICES.find(s => s.name === serviceName);
    if (selectedService) {
      setNewService({
        ...newService,
        name: selectedService.name,
        category: selectedService.category,
        price: selectedService.defaultPrice
      });
      setIsCustomService(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name || newService.price <= 0) {
      toast.error('Please enter service name and valid price');
      return;
    }

    try {
      // Create transaction for the IPD service
      const transactionData = {
        patient_id: patientAdmission.patient_id,
        transaction_type: newService.category,
        amount: newService.price * newService.quantity,
        description: `${newService.name}${newService.quantity > 1 ? ` x${newService.quantity}` : ''}${newService.notes ? ` - ${newService.notes}` : ''} (IPD)`,
        payment_mode: 'CASH' as const,
        status: 'COMPLETED' as const
      };

      const transaction = await HospitalService.createTransaction(transactionData);
      
      // Update IPD admission total
      await updateIPDTotal();
      
      // Add to local state
      const serviceItem: IPDServiceItem = {
        ...newService,
        id: transaction.id,
        transactionId: transaction.id
      };
      
      setServices([...services, serviceItem]);
      
      // Reset form
      setNewService({
        name: '',
        category: selectedCategory,
        price: 0,
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
      });
      setIsCustomService(false);
      
      toast.success('IPD service added successfully');
      onServicesUpdated?.();
    } catch (error) {
      console.error('Error adding IPD service:', error);
      toast.error('Failed to add service');
    }
  };

  const updateIPDTotal = async () => {
    try {
      // Calculate total from all IPD transactions
      const transactions = await HospitalService.getTransactionsByPatient(patientAdmission.patient_id);
      const ipdTransactions = transactions.filter(t => 
        new Date(t.created_at) >= new Date(patientAdmission.admission_date) &&
        t.status === 'COMPLETED'
      );
      
      const totalAmount = ipdTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Update admission record
      await supabase
        .from('patient_admissions')
        .update({ 
          total_amount: totalAmount,
          balance_amount: totalAmount - (patientAdmission.amount_paid || 0)
        })
        .eq('id', patientAdmission.id);
        
    } catch (error) {
      console.error('Error updating IPD total:', error);
    }
  };

  const handleRemoveService = async (serviceId: string, transactionId?: string) => {
    try {
      // Remove from database if transaction exists
      if (transactionId) {
        const { error } = await supabase
          .from('patient_transactions')
          .delete()
          .eq('id', transactionId);
          
        if (error) {
          console.error('Error deleting transaction:', error);
          toast.error('Failed to remove service from database');
          return;
        }
      }
      
      // Remove from local state
      setServices(services.filter(s => s.id !== serviceId));
      await updateIPDTotal();
      toast.success('Service removed successfully');
      onServicesUpdated?.();
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    }
  };

  const calculateTotal = () => {
    return services.reduce((total, service) => total + (service.price * service.quantity), 0);
  };

  const getDaysAdmitted = () => {
    const admissionDate = new Date(patientAdmission.admission_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">🛏️ IPD Service Management</h2>
            <p className="text-blue-100">
              Bed: {patientAdmission.bed_number} • Room: {patientAdmission.room_type} • Day {getDaysAdmitted()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col h-full" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Add Service Section */}
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Add IPD Service</h3>
            
            {/* Category Selection */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-4">
              {(['ACCOMMODATION', 'NURSING', 'MEDICINE', 'PROCEDURE', 'DIAGNOSTIC', 'THERAPY', 'OTHER'] as const).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setNewService({ ...newService, category });
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Service Selection/Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                {!isCustomService ? (
                  <div className="flex gap-2">
                    <select
                      value={newService.name}
                      onChange={(e) => handleServiceSelect(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Service</option>
                      {getFilteredServices().map(service => (
                        <option key={service.name} value={service.name}>
                          {service.name} - ₹{service.defaultPrice}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsCustomService(true)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      title="Add custom service"
                    >
                      ✏️
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newService.name}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      placeholder="Enter custom service name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        setIsCustomService(false);
                        setNewService({ ...newService, name: '' });
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      title="Select from list"
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={newService.price || ''}
                  onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newService.quantity}
                  onChange={(e) => setNewService({ ...newService, quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newService.date}
                  onChange={(e) => setNewService({ ...newService, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes and Add Button */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={newService.notes || ''}
                  onChange={(e) => setNewService({ ...newService, notes: e.target.value })}
                  placeholder="Additional notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddService}
                  disabled={!newService.name || newService.price <= 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➕ Add Service
                </button>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">IPD Services ({services.length})</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No services added yet. Add services using the form above.
              </div>
            ) : (
              <div className="space-y-2">
                {services.map((service, index) => (
                  <div
                    key={service.id || index}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">{service.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          {service.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {service.date}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ₹{service.price} × {service.quantity} = ₹{service.price * service.quantity}
                        {service.notes && <span className="ml-2 text-gray-500">• {service.notes}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveService(service.id || String(index), service.transactionId)}
                      className="ml-4 text-red-600 hover:text-red-800 p-1"
                      title="Remove service"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold text-gray-800">Total IPD Services:</span>
                <span className="ml-2 text-2xl font-bold text-blue-600">
                  ₹{calculateTotal().toLocaleString()}
                </span>
              </div>
              <div className="space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDServiceManager;