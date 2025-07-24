import React, { useState, useEffect } from 'react';
import { 
  MEDICAL_SERVICES, 
  SERVICE_CATEGORIES, 
  getServicesByCategory, 
  searchServices, 
  calculateServiceTotal,
  type MedicalService, 
  type ServiceOrder, 
  type OrderedService,
  type ServiceCategory 
} from '../data/medicalServices';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import { useReceiptPrinting } from '../hooks/useReceiptPrinting';

interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  age: number;
  gender: string;
  blood_group?: string;
}

const HospitalServices: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceCart, setServiceCart] = useState<OrderedService[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'INSURANCE' | 'CREDIT'>('CASH');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);

  const { printServiceReceipt } = useReceiptPrinting();

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
    loadRecentOrders();
  }, []);

  const loadPatients = async () => {
    try {
      const patientsList = await HospitalService.getAllPatients();
      setPatients(patientsList);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('*, patient:patients(first_name, last_name, patient_id)')
        .eq('transaction_type', 'service')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentOrders(data);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  // Filter services based on category and search
  const getFilteredServices = (): MedicalService[] => {
    let filteredServices = MEDICAL_SERVICES.filter(service => service.isActive);

    if (selectedCategory !== 'ALL') {
      filteredServices = getServicesByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      filteredServices = searchServices(searchQuery);
    }

    return filteredServices;
  };

  // Filter patients based on search
  const getFilteredPatients = (): Patient[] => {
    if (!patientSearchQuery.trim()) return patients;
    
    const query = patientSearchQuery.toLowerCase();
    return patients.filter(patient => 
      patient.first_name.toLowerCase().includes(query) ||
      (patient.last_name?.toLowerCase().includes(query)) ||
      patient.patient_id.toLowerCase().includes(query) ||
      patient.phone.includes(query)
    );
  };

  // Add service to cart
  const addToCart = (service: MedicalService, quantity: number = 1) => {
    const existingItem = serviceCart.find(item => item.serviceId === service.id);
    
    if (existingItem) {
      setServiceCart(cart => 
        cart.map(item => 
          item.serviceId === service.id
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                totalPrice: (item.quantity + quantity) * item.unitPrice
              }
            : item
        )
      );
    } else {
      const newItem: OrderedService = {
        serviceId: service.id,
        serviceName: service.name,
        quantity,
        unitPrice: service.basePrice,
        totalPrice: service.basePrice * quantity,
        status: 'PENDING'
      };
      setServiceCart(cart => [...cart, newItem]);
    }
  };

  // Remove service from cart
  const removeFromCart = (serviceId: string) => {
    setServiceCart(cart => cart.filter(item => item.serviceId !== serviceId));
  };

  // Update cart item quantity
  const updateCartQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }

    setServiceCart(cart => 
      cart.map(item => 
        item.serviceId === serviceId
          ? { 
              ...item, 
              quantity,
              totalPrice: quantity * item.unitPrice
            }
          : item
      )
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = calculateServiceTotal(serviceCart);
    const netAmount = subtotal - discountAmount;
    return { subtotal, discountAmount, netAmount };
  };

  // Submit service order
  const submitOrder = async () => {
    if (!selectedPatient || serviceCart.length === 0) {
      alert('Please select a patient and add services to cart');
      return;
    }

    setLoading(true);
    try {
      const { subtotal, netAmount } = calculateTotals();
      const orderData: Omit<ServiceOrder, 'id'> = {
        patientId: selectedPatient.id,
        services: serviceCart,
        totalAmount: subtotal,
        discountAmount,
        netAmount,
        paymentMode,
        status: 'PENDING',
        orderedBy: 'System User',
        orderedAt: new Date().toISOString(),
        notes: orderNotes
      };

      // Create transaction entry directly (no service_orders table)
      const transactionData = {
        patient_id: selectedPatient.id,
        transaction_type: 'service',
        amount: netAmount,
        payment_mode: paymentMode.toLowerCase(),
        department: 'Medical Services',
        description: `Medical Services - ${serviceCart.map(s => s.serviceName).join(', ')}`,
        created_at: new Date().toISOString()
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Print receipt
      if (transaction) {
        await printServiceReceipt(transaction.id);
      }

      // Reset form
      setServiceCart([]);
      setShowOrderForm(false);
      setDiscountAmount(0);
      setOrderNotes('');
      setSelectedPatient(null);
      setShowPatientSearch(false);
      
      // Reload recent orders
      loadRecentOrders();

      alert('Service order created successfully!');
    } catch (error) {
      console.error('Error creating service order:', error);
      alert('Failed to create service order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hospital Services</h1>
            <p className="text-gray-600 mt-1">Medical services and diagnostic tests</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPatientSearch(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🏥 New Service Order
            </button>
            {serviceCart.length > 0 && (
              <button
                onClick={() => setShowOrderForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors relative"
              >
                📋 Review Cart ({serviceCart.length})
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {serviceCart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Selection Modal */}
        {showPatientSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Select Patient</h2>
                <button
                  onClick={() => setShowPatientSearch(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name, ID, or phone..."
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredPatients().map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setShowPatientSearch(false);
                    }}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name || ''}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          ID: {patient.patient_id} | Phone: {patient.phone} | Age: {patient.age} | Gender: {patient.gender}
                        </p>
                      </div>
                      <div className="text-blue-600">Select</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Patient Info */}
        {selectedPatient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">
                  Selected Patient: {selectedPatient.first_name} {selectedPatient.last_name || ''}
                </h2>
                <p className="text-blue-700">
                  ID: {selectedPatient.patient_id} | Phone: {selectedPatient.phone} | 
                  Age: {selectedPatient.age} | Gender: {selectedPatient.gender}
                  {selectedPatient.blood_group && ` | Blood Group: ${selectedPatient.blood_group}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                Change Patient
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Service Categories & Search */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Search Services</h3>
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'ALL' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  📋 All Services
                </button>
                {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key as ServiceCategory)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === key 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.icon} {category.name}
                    <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Services List */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFilteredServices().map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">Code: {service.code}</p>
                      <p className="text-sm text-gray-700 mb-2">{service.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                        <span>🏥 {service.department}</span>
                        <span>⏱️ {service.duration} min</span>
                        {service.fastingRequired && <span>🚫 Fasting Required</span>}
                        {service.preparationRequired && <span>📋 Preparation Needed</span>}
                      </div>

                      {service.instructions && (
                        <p className="text-xs text-blue-600 mb-3">
                          📝 {service.instructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">
                        ₹{service.basePrice.toLocaleString()}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        SERVICE_CATEGORIES[service.category]?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        SERVICE_CATEGORIES[service.category]?.color === 'green' ? 'bg-green-100 text-green-800' :
                        SERVICE_CATEGORIES[service.category]?.color === 'red' ? 'bg-red-100 text-red-800' :
                        SERVICE_CATEGORIES[service.category]?.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                        SERVICE_CATEGORIES[service.category]?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {SERVICE_CATEGORIES[service.category]?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {serviceCart.find(item => item.serviceId === service.id) && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              const item = serviceCart.find(i => i.serviceId === service.id);
                              if (item) updateCartQuantity(service.id, item.quantity - 1);
                            }}
                            className="w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium">
                            {serviceCart.find(item => item.serviceId === service.id)?.quantity || 0}
                          </span>
                          <button
                            onClick={() => {
                              const item = serviceCart.find(i => i.serviceId === service.id);
                              if (item) updateCartQuantity(service.id, item.quantity + 1);
                            }}
                            className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-sm"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => addToCart(service)}
                      disabled={!selectedPatient}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        !selectedPatient
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {serviceCart.find(item => item.serviceId === service.id) ? 'Add More' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Review Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Review Service Order</h2>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedPatient && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2">Patient Information</h3>
                  <p>{selectedPatient.first_name} {selectedPatient.last_name || ''}</p>
                  <p className="text-sm text-gray-600">
                    ID: {selectedPatient.patient_id} | Phone: {selectedPatient.phone}
                  </p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Selected Services</h3>
                <div className="space-y-3">
                  {serviceCart.map((item) => (
                    <div key={item.serviceId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.serviceName}</h4>
                        <p className="text-sm text-gray-600">
                          ₹{item.unitPrice.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{item.totalPrice.toLocaleString()}</div>
                        <button
                          onClick={() => removeFromCart(item.serviceId)}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Notes
                </label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or instructions..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateTotals().subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>- ₹{discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Net Amount:</span>
                    <span>₹{calculateTotals().netAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitOrder}
                  disabled={loading || !selectedPatient || serviceCart.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Confirm Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Service Orders</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.patient?.first_name} {order.patient?.last_name || ''}
                          <div className="text-xs text-gray-500">ID: {order.patient?.patient_id}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {order.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{order.amount?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {order.payment_mode?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalServices;