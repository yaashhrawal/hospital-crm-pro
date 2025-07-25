import React, { useState, useEffect } from 'react';
import type { Patient, PatientTransaction } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import toast from 'react-hot-toast';

interface PatientServiceManagerProps {
  patient: Patient;
  onClose: () => void;
  onServicesUpdated?: () => void;
}

interface ServiceItem {
  id?: string;
  name: string;
  category: 'LAB_TEST' | 'XRAY' | 'PROCEDURE' | 'MEDICINE' | 'SERVICE';
  price: number;
  quantity: number;
  notes?: string;
  transactionId?: string; // For existing services
}

// Predefined medical services catalog
const MEDICAL_SERVICES = [
  // Lab Tests
  { name: 'Blood Test - CBC', category: 'LAB_TEST' as const, defaultPrice: 200 },
  { name: 'Blood Sugar Test', category: 'LAB_TEST' as const, defaultPrice: 100 },
  { name: 'Liver Function Test', category: 'LAB_TEST' as const, defaultPrice: 400 },
  { name: 'Kidney Function Test', category: 'LAB_TEST' as const, defaultPrice: 450 },
  { name: 'Lipid Profile', category: 'LAB_TEST' as const, defaultPrice: 350 },
  { name: 'Thyroid Test', category: 'LAB_TEST' as const, defaultPrice: 500 },
  { name: 'Urine Test', category: 'LAB_TEST' as const, defaultPrice: 150 },
  { name: 'ECG', category: 'LAB_TEST' as const, defaultPrice: 150 },
  
  // X-Ray & Imaging
  { name: 'X-Ray Chest', category: 'XRAY' as const, defaultPrice: 300 },
  { name: 'X-Ray Abdomen', category: 'XRAY' as const, defaultPrice: 350 },
  { name: 'X-Ray Spine', category: 'XRAY' as const, defaultPrice: 400 },
  { name: 'Ultrasound Abdomen', category: 'XRAY' as const, defaultPrice: 800 },
  { name: 'CT Scan', category: 'XRAY' as const, defaultPrice: 3000 },
  { name: 'MRI', category: 'XRAY' as const, defaultPrice: 5000 },
  
  // Procedures
  { name: 'Dressing', category: 'PROCEDURE' as const, defaultPrice: 150 },
  { name: 'Injection', category: 'PROCEDURE' as const, defaultPrice: 50 },
  { name: 'Nebulization', category: 'PROCEDURE' as const, defaultPrice: 200 },
  { name: 'Suture Removal', category: 'PROCEDURE' as const, defaultPrice: 200 },
  { name: 'Catheterization', category: 'PROCEDURE' as const, defaultPrice: 500 },
  
  // Common Medicines
  { name: 'Paracetamol', category: 'MEDICINE' as const, defaultPrice: 10 },
  { name: 'Antibiotics', category: 'MEDICINE' as const, defaultPrice: 50 },
  { name: 'Pain Killer', category: 'MEDICINE' as const, defaultPrice: 30 },
  { name: 'IV Fluids', category: 'MEDICINE' as const, defaultPrice: 200 },
  
  // Other Services
  { name: 'Ambulance Service', category: 'SERVICE' as const, defaultPrice: 500 },
  { name: 'Oxygen', category: 'SERVICE' as const, defaultPrice: 300 },
  { name: 'Wheelchair', category: 'SERVICE' as const, defaultPrice: 100 },
];

const PatientServiceManager: React.FC<PatientServiceManagerProps> = ({
  patient,
  onClose,
  onServicesUpdated
}) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newService, setNewService] = useState<ServiceItem>({
    name: '',
    category: 'LAB_TEST',
    price: 0,
    quantity: 1
  });
  const [selectedCategory, setSelectedCategory] = useState<ServiceItem['category']>('LAB_TEST');
  const [isCustomService, setIsCustomService] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingTransactions, setExistingTransactions] = useState<PatientTransaction[]>([]);

  useEffect(() => {
    loadExistingServices();
  }, [patient.id]);

  const loadExistingServices = async () => {
    try {
      setLoading(true);
      const transactions = await HospitalService.getTransactionsByPatient(patient.id);
      
      // Filter service-related transactions
      const serviceTransactions = transactions.filter(t => 
        ['LAB_TEST', 'XRAY', 'PROCEDURE', 'MEDICINE', 'SERVICE'].includes(t.transaction_type) &&
        t.status === 'COMPLETED'
      );
      
      setExistingTransactions(serviceTransactions);
      
      // Convert transactions to service items
      const existingServices = serviceTransactions.map(t => ({
        id: t.id,
        name: t.description || t.transaction_type,
        category: t.transaction_type as ServiceItem['category'],
        price: t.amount,
        quantity: 1,
        transactionId: t.id
      }));
      
      setServices(existingServices);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load existing services');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredServices = () => {
    return MEDICAL_SERVICES.filter(s => s.category === selectedCategory);
  };

  const handleServiceSelect = (serviceName: string) => {
    const selectedService = MEDICAL_SERVICES.find(s => s.name === serviceName);
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
      // Create transaction for the service
      const transactionData = {
        patient_id: patient.id,
        transaction_type: newService.category,
        amount: newService.price * newService.quantity,
        description: `${newService.name}${newService.quantity > 1 ? ` x${newService.quantity}` : ''}${newService.notes ? ` - ${newService.notes}` : ''}`,
        payment_mode: 'CASH' as const, // Default to cash, can be updated later
        status: 'COMPLETED' as const
      };

      const transaction = await HospitalService.createTransaction(transactionData);
      
      // Add to local state
      const serviceItem: ServiceItem = {
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
        quantity: 1
      });
      setIsCustomService(false);
      
      toast.success('Service added successfully');
      onServicesUpdated?.();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const handleRemoveService = async (serviceId: string, transactionId?: string) => {
    if (!transactionId) {
      // Just remove from local state if no transaction
      setServices(services.filter(s => s.id !== serviceId));
      return;
    }

    try {
      // For now, we'll just remove from display
      // In production, you might want to add a "cancelled" status instead
      setServices(services.filter(s => s.id !== serviceId));
      toast.success('Service removed');
      onServicesUpdated?.();
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    }
  };

  const calculateTotal = () => {
    return services.reduce((total, service) => total + (service.price * service.quantity), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Medical Services Management</h2>
            <p className="text-indigo-100">
              Patient: {patient.first_name} {patient.last_name} • ID: {patient.patient_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col h-full" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Add Service Section */}
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Add New Service</h3>
            
            {/* Category Selection */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {(['LAB_TEST', 'XRAY', 'PROCEDURE', 'MEDICINE', 'SERVICE'] as const).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setNewService({ ...newService, category });
                  }}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-100'
                  }`}
                >
                  {category.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
              </div>
            </div>

            {/* Notes */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddService}
                  disabled={!newService.name || newService.price <= 0}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➕ Add Service
                </button>
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Services</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
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
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {service.category.replace('_', ' ')}
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
                <span className="text-lg font-semibold text-gray-800">Total Services Amount:</span>
                <span className="ml-2 text-2xl font-bold text-indigo-600">
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

export default PatientServiceManager;