import React, { useState, useEffect } from 'react';
import type { Patient, PatientTransaction } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DOCTOR_DEGREES } from '../data/doctorDegrees';

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
  discount: number; // Discount percentage (0-100)
  notes?: string;
  serviceDate?: string; // Date when service was provided
  paymentMode: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'BANK_TRANSFER' | 'INSURANCE';
  doctorName?: string; // Manually selected doctor name
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
  const queryClient = useQueryClient();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [newService, setNewService] = useState<ServiceItem>({
    name: '',
    category: 'LAB_TEST',
    price: 0,
    quantity: 1,
    discount: 0,
    serviceDate: new Date().toISOString().split('T')[0], // Today's date
    paymentMode: 'CASH',
    doctorName: patient.assigned_doctor || '' // Default to patient's assigned doctor
  });
  const [selectedCategory, setSelectedCategory] = useState<ServiceItem['category']>('LAB_TEST');
  const [isCustomService, setIsCustomService] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingTransactions, setExistingTransactions] = useState<PatientTransaction[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  useEffect(() => {
    loadExistingServices();
  }, [patient.id]);

  const loadExistingServices = async () => {
    try {
      setLoading(true);
      const transactions = await HospitalService.getTransactionsByPatient(patient.id);
      
      // Filter service-related transactions (exclude cancelled ones)
      const serviceTransactions = transactions.filter(t => 
        ['LAB_TEST', 'XRAY', 'PROCEDURE', 'MEDICINE', 'SERVICE'].includes(t.transaction_type) &&
        t.status === 'COMPLETED' // This already excludes CANCELLED status
      );
      
      setExistingTransactions(serviceTransactions);
      
      // Convert transactions to service items
      const existingServices = serviceTransactions.map(t => {
        // Try to extract discount from description if it exists
        let discount = 0;
        let originalPrice = t.amount;
        // FIX: Use transaction_date if available, otherwise fall back to created_at
        let serviceDate = t.transaction_date 
          ? (t.transaction_date.includes('T') ? t.transaction_date.split('T')[0] : t.transaction_date)
          : (t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
        
        const discountMatch = t.description?.match(/Discount:\s*(\d+)%/);
        if (discountMatch) {
          discount = parseInt(discountMatch[1]);
        }
        const originalMatch = t.description?.match(/Original:\s*₹([\d,]+)/);
        if (originalMatch) {
          originalPrice = parseFloat(originalMatch[1].replace(/,/g, ''));
        }
        // Extract service date from description if present
        const dateMatch = t.description?.match(/\[Date:\s*(\d{4}-\d{2}-\d{2})\]/);
        if (dateMatch) {
          serviceDate = dateMatch[1];
          console.log('📅 Found service date in description:', serviceDate);
        }
        
        // Extract service name (before any parentheses or brackets)
        let serviceName = t.description || t.transaction_type;
        const nameMatch = serviceName.match(/^([^(\[]+)/);
        if (nameMatch) {
          serviceName = nameMatch[1].trim();
        }
        
        return {
          id: t.id,
          name: serviceName,
          category: t.transaction_type as ServiceItem['category'],
          price: originalPrice,
          quantity: 1,
          discount: discount,
          serviceDate: serviceDate,
          paymentMode: t.payment_mode as ServiceItem['paymentMode'],
          doctorName: t.doctor_name || patient.assigned_doctor || '', // Get doctor from transaction or fall back
          transactionId: t.id
        };
      });
      
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
        price: selectedService.defaultPrice,
        discount: 0
      });
      setIsCustomService(false);
    }
  };

  const handleAddService = async () => {
    console.log('🚨 handleAddService called!', { newService });
    
    if (!newService.name || newService.price <= 0) {
      toast.error('Please enter service name and valid price');
      return;
    }

    try {
      // Calculate final amount after discount
      const originalAmount = newService.price * newService.quantity;
      const discountAmount = originalAmount * (newService.discount / 100);
      const finalAmount = originalAmount - discountAmount;
      
      // Create transaction for the service
      const finalServiceDate = newService.serviceDate || new Date().toISOString().split('T')[0];
      console.log('📅 SERVICE DATE DEBUG (PatientServiceManager):', {
        serviceDate: newService.serviceDate,
        serviceDateType: typeof newService.serviceDate,
        fallbackDate: new Date().toISOString().split('T')[0],
        finalServiceDate: finalServiceDate,
        finalServiceDateType: typeof finalServiceDate,
        jsDateParsed: new Date(finalServiceDate),
        jsDateISO: new Date(finalServiceDate).toISOString()
      });
      
      const transactionData = {
        patient_id: patient.id,
        transaction_type: newService.category,
        amount: finalAmount,
        description: `${newService.name}${newService.quantity > 1 ? ` x${newService.quantity}` : ''}${newService.serviceDate ? ` [Date: ${newService.serviceDate}]` : ''}${newService.notes ? ` - ${newService.notes}` : ''}`,
        payment_mode: newService.paymentMode,
        status: 'COMPLETED' as const,
        transaction_date: finalServiceDate, // 🔍 CRITICAL FIX: Set actual transaction_date field
        discount_percentage: newService.discount || 0,
        doctor_name: newService.doctorName || null // Save the selected doctor name
      };
      
      console.log('📤 SENDING TRANSACTION DATA:', {
        transaction_date: transactionData.transaction_date,
        full_data: transactionData
      });

      const transaction = await HospitalService.createTransaction(transactionData);
      
      // Add to local state
      const serviceItem: ServiceItem = {
        ...newService,
        id: transaction.id,
        transactionId: transaction.id
      };
      
      setServices([...services, serviceItem]);
      
      // 🔄 CRITICAL FIX: Invalidate React Query cache to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['operations'] }); // This covers ['operations', 'revenue-expenses', ...]
      queryClient.invalidateQueries({ queryKey: ['all-patients'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      console.log('💰 SERVICE ADDED - Cache invalidated for dashboard refresh');
      
      // Reset form
      setNewService({
        name: '',
        category: selectedCategory,
        price: 0,
        quantity: 1,
        discount: 0,
        serviceDate: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        doctorName: patient.assigned_doctor || '' // Reset to patient's assigned doctor
      });
      setIsCustomService(false);
      
      toast.success('Service added successfully');
      
      // Trigger dashboard refresh event to update revenue calculations
      window.dispatchEvent(new Event('servicesUpdated'));
      window.dispatchEvent(new Event('transactionUpdated'));
      
      onServicesUpdated?.();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const handleEditService = (index: number) => {
    const serviceToEdit = services[index];
    setEditingIndex(index);
    setEditingService({ ...serviceToEdit });
  };

  const handleUpdateService = async () => {
    if (!editingService || editingIndex === null) return;
    
    try {
      const finalUpdateDate = editingService.serviceDate || new Date().toISOString().split('T')[0];
      console.log('📅 UPDATING SERVICE DATE DEBUG (PatientServiceManager):', {
        editingServiceDate: editingService.serviceDate,
        editingServiceDateType: typeof editingService.serviceDate,
        fallbackDate: new Date().toISOString().split('T')[0],
        finalUpdateDate: finalUpdateDate,
        jsDateParsed: new Date(finalUpdateDate),
        jsDateISO: new Date(finalUpdateDate).toISOString()
      });
      
      if (editingService.transactionId) {
        // Calculate final amount after discount
        const originalAmount = editingService.price * editingService.quantity;
        const discountAmount = originalAmount * (editingService.discount / 100);
        const finalAmount = originalAmount - discountAmount;
        
        const updatedDescription = `${editingService.name}${editingService.quantity > 1 ? ` x${editingService.quantity}` : ''}${editingService.serviceDate ? ` [Date: ${editingService.serviceDate}]` : ''}${editingService.notes ? ` - ${editingService.notes}` : ''}`;
        
        console.log('📝 Updated description with date:', updatedDescription);
        
        // Update the transaction in database
        await HospitalService.updateTransaction(editingService.transactionId, {
          amount: finalAmount,
          description: updatedDescription,
          payment_mode: editingService.paymentMode,
          transaction_date: finalUpdateDate, // 🔥 CRITICAL FIX: Update transaction_date field
          discount_percentage: editingService.discount || 0,
          doctor_name: editingService.doctorName || null // Save the selected doctor name
        });
        
        console.log('🔥 UPDATED TRANSACTION_DATE:', editingService.serviceDate);
      }
      
      // Update local state
      const updatedServices = [...services];
      updatedServices[editingIndex] = editingService;
      setServices(updatedServices);
      
      console.log('✅ Service updated with new date:', editingService.serviceDate);
      
      // Reset edit state
      setEditingIndex(null);
      setEditingService(null);
      
      // 🔄 CRITICAL: Invalidate React Query cache to refresh operations ledger
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['all-patients'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      toast.success('Service updated successfully');
      
      // Trigger dashboard refresh event to update revenue calculations
      window.dispatchEvent(new Event('servicesUpdated'));
      window.dispatchEvent(new Event('transactionUpdated'));
      
      onServicesUpdated?.();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingService(null);
  };

  const handleRemoveService = async (index: number) => {
    const serviceToRemove = services[index];
    
    try {
      // If the service has a transaction ID, delete it from the database
      if (serviceToRemove.transactionId) {
        await HospitalService.deleteTransaction(serviceToRemove.transactionId);
      }
      
      // Remove from local state by index
      const updatedServices = services.filter((_, i) => i !== index);
      setServices(updatedServices);
      
      toast.success('Service removed permanently');
      onServicesUpdated?.();
      
      // Trigger dashboard refresh
      window.dispatchEvent(new Event('transactionUpdated'));
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    }
  };

  const calculateTotal = () => {
    return services.reduce((total, service) => {
      const originalAmount = service.price * service.quantity;
      const discountAmount = originalAmount * (service.discount / 100);
      return total + (originalAmount - discountAmount);
    }, 0);
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

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={newService.discount || ''}
                  onChange={(e) => setNewService({ ...newService, discount: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              {/* Service Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 Service Date
                </label>
                <input
                  type="date"
                  value={newService.serviceDate || ''}
                  onChange={(e) => setNewService({ ...newService, serviceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                />
              </div>
            </div>

            {/* Payment Mode, Doctor and Notes Row */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={newService.paymentMode}
                  onChange={(e) => setNewService({ ...newService, paymentMode: e.target.value as ServiceItem['paymentMode'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="ONLINE">Online</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>

              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  👨‍⚕️ Doctor
                </label>
                <select
                  value={newService.doctorName || ''}
                  onChange={(e) => setNewService({ ...newService, doctorName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Doctor</option>
                  {Object.keys(DOCTOR_DEGREES).map(doctorName => (
                    <option key={doctorName} value={doctorName}>
                      {doctorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
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
              <div className="flex flex-col items-end">
                {/* Amount Preview */}
                {newService.price > 0 && (
                  <div className="text-sm text-gray-600 mb-2 text-right">
                    {(() => {
                      const originalAmount = newService.price * newService.quantity;
                      const discountAmount = originalAmount * (newService.discount / 100);
                      const finalAmount = originalAmount - discountAmount;
                      
                      return (
                        <>
                          <div>Amount: ₹{originalAmount.toLocaleString()}</div>
                          {newService.discount > 0 && (
                            <>
                              <div className="text-red-600">Discount: -₹{discountAmount.toLocaleString()}</div>
                              <div className="font-bold text-green-600">Final: ₹{finalAmount.toLocaleString()}</div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
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
                    key={service.transactionId || service.id || `service-${index}`}
                    className="p-3 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    {editingIndex === index ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Service Name</label>
                            <input
                              type="text"
                              value={editingService?.name || ''}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, name: e.target.value} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                            <input
                              type="number"
                              value={editingService?.price || ''}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, price: Number(e.target.value) || 0} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={editingService?.quantity || 1}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, quantity: Math.max(1, Number(e.target.value) || 1)} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Discount (%)</label>
                            <input
                              type="number"
                              value={editingService?.discount || ''}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, discount: Math.max(0, Math.min(100, Number(e.target.value) || 0))} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              min="0"
                              max="100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">📅 Service Date</label>
                            <input
                              type="date"
                              value={editingService?.serviceDate || ''}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, serviceDate: e.target.value} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
                            <select
                              value={editingService?.paymentMode || 'CASH'}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, paymentMode: e.target.value as ServiceItem['paymentMode']} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="CASH">Cash</option>
                              <option value="CARD">Card</option>
                              <option value="UPI">UPI</option>
                              <option value="ONLINE">Online</option>
                              <option value="BANK_TRANSFER">Bank Transfer</option>
                              <option value="INSURANCE">Insurance</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">👨‍⚕️ Doctor</label>
                            <select
                              value={editingService?.doctorName || ''}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, doctorName: e.target.value} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Select Doctor</option>
                              {Object.keys(DOCTOR_DEGREES).map(doctorName => (
                                <option key={doctorName} value={doctorName}>
                                  {doctorName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                            <input
                              type="text"
                              value={editingService?.notes || ''}
                              onChange={(e) => setEditingService(prev => prev ? {...prev, notes: e.target.value} : null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Optional notes"
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <button
                              onClick={handleUpdateService}
                              className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </div>
                        {/* Amount Preview in Edit Mode */}
                        {editingService && editingService.price > 0 && (
                          <div className="text-sm text-right text-gray-600 border-t pt-2">
                            {(() => {
                              const originalAmount = editingService.price * editingService.quantity;
                              const discountAmount = originalAmount * (editingService.discount / 100);
                              const finalAmount = originalAmount - discountAmount;
                              return (
                                <>
                                  <div>Amount: ₹{originalAmount.toLocaleString()}</div>
                                  {editingService.discount > 0 && (
                                    <>
                                      <div className="text-red-600">Discount: -₹{discountAmount.toLocaleString()}</div>
                                      <div className="font-bold text-green-600">Final: ₹{finalAmount.toLocaleString()}</div>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-800">{service.name}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {service.category.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {(() => {
                              const originalAmount = service.price * service.quantity;
                              const discountAmount = originalAmount * (service.discount / 100);
                              const finalAmount = originalAmount - discountAmount;
                              
                              return (
                                <>
                                  ₹{service.price} × {service.quantity} = ₹{originalAmount.toLocaleString()}
                                  {service.discount > 0 && (
                                    <>
                                      <span className="ml-2 text-red-600 font-medium">
                                        -{service.discount}% (₹{discountAmount.toLocaleString()})
                                      </span>
                                      <span className="ml-2 text-green-600 font-bold">
                                        Final: ₹{finalAmount.toLocaleString()}
                                      </span>
                                    </>
                                  )}
                                  <span className="ml-2 text-gray-500">• {service.paymentMode}</span>
                                  {service.serviceDate && (
                                    <span className="ml-2 text-blue-600">
                                      • 📅 {new Date(service.serviceDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  <span className="ml-2 text-purple-600">
                                    • 👨‍⚕️ {service.doctorName || patient.assigned_doctor || 'Not Assigned'}
                                  </span>
                                  {service.notes && <span className="ml-2 text-gray-500">• {service.notes}</span>}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditService(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit service"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoveService(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove service"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
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