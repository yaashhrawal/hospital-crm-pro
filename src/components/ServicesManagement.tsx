import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  HOSPITAL_SERVICES, 
  HospitalService, 
  getServicesByCategory, 
  searchServices, 
  getServiceCategories,
  getSubCategories,
  calculateServiceTotal,
  getServicePrice
} from '../data/hospitalServices';

interface ServiceSelectionProps {
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
  isCoorporate: boolean;
  onCoorporateChange: (isCoorporate: boolean) => void;
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  selectedServices,
  onServiceToggle,
  isCoorporate,
  onCoorporateChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');

  const categories = getServiceCategories();
  const subCategories = selectedCategory !== 'ALL' 
    ? getSubCategories(selectedCategory as HospitalService['category'])
    : [];

  const getFilteredServices = (): HospitalService[] => {
    let services = HOSPITAL_SERVICES;

    // Apply search filter
    if (searchTerm.trim()) {
      services = searchServices(searchTerm);
    }

    // Apply category filter
    if (selectedCategory !== 'ALL') {
      services = services.filter(service => service.category === selectedCategory);
    }

    // Apply sub-category filter
    if (selectedSubCategory !== 'ALL') {
      services = services.filter(service => service.subCategory === selectedSubCategory);
    }

    return services;
  };

  const filteredServices = getFilteredServices();
  const totalAmount = calculateServiceTotal(selectedServices, isCoorporate);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory('ALL');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-category Filter */}
          <div>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              disabled={selectedCategory === 'ALL'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="ALL">All Sub-categories</option>
              {subCategories.map(subCategory => (
                <option key={subCategory} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </select>
          </div>

          {/* Corporate Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="corporate-rate"
              checked={isCoorporate}
              onChange={(e) => onCoorporateChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="corporate-rate" className="text-sm font-medium text-gray-700">
              Corporate Rate
            </label>
          </div>
        </div>

        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">
                {selectedServices.length} service(s) selected
              </span>
              <span className="text-lg font-bold text-blue-900">
                Total: ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const isSelected = selectedServices.includes(service.id);
          const price = getServicePrice(service.id, isCoorporate);

          return (
            <div
              key={service.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => onServiceToggle(service.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">{service.name}</h3>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onServiceToggle(service.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{service.category}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {service.subCategory}
                  </span>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Duration: {service.duration} min
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₹{price.toLocaleString()}
                    </div>
                    {!isCoorporate && service.corporateRate !== service.generalRate && (
                      <div className="text-xs text-gray-500">
                        Corporate: ₹{service.corporateRate.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}
    </div>
  );
};

interface ServicesManagementProps {
  onServiceBooking?: (services: string[], isCoorporate: boolean) => void;
}

const ServicesManagement: React.FC<ServicesManagementProps> = ({ onServiceBooking }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isCoorporate, setIsCoorporate] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'booking'>('browse');

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBookServices = () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (onServiceBooking) {
      onServiceBooking(selectedServices, isCoorporate);
    } else {
      // Default behavior - show booking form
      setActiveTab('booking');
    }
  };

  const clearSelection = () => {
    setSelectedServices([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🏥 Hospital Services</h1>
        <p className="text-gray-600">Browse and book hospital services with transparent pricing</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Browse Services
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'booking'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={selectedServices.length === 0}
          >
            📅 Book Services ({selectedServices.length})
          </button>
        </div>

        {selectedServices.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={handleBookServices}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              📅 Book Selected Services
            </button>
            <button
              onClick={clearSelection}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'browse' && (
        <ServiceSelection
          selectedServices={selectedServices}
          onServiceToggle={handleServiceToggle}
          isCoorporate={isCoorporate}
          onCoorporateChange={setIsCoorporate}
        />
      )}

      {activeTab === 'booking' && (
        <ServiceBookingForm
          selectedServices={selectedServices}
          isCoorporate={isCoorporate}
          onBack={() => setActiveTab('browse')}
          onBookingComplete={() => {
            setSelectedServices([]);
            setActiveTab('browse');
          }}
        />
      )}
    </div>
  );
};

interface ServiceBookingFormProps {
  selectedServices: string[];
  isCoorporate: boolean;
  onBack: () => void;
  onBookingComplete: () => void;
}

const ServiceBookingForm: React.FC<ServiceBookingFormProps> = ({
  selectedServices,
  isCoorporate,
  onBack,
  onBookingComplete
}) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    phone: '',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'ROUTINE' as 'ROUTINE' | 'URGENT' | 'EMERGENCY',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const totalAmount = calculateServiceTotal(selectedServices, isCoorporate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement actual booking logic with database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success('Services booked successfully!');
      onBookingComplete();
    } catch (error) {
      toast.error('Failed to book services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Book Services</h2>
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to Services
          </button>
        </div>

        {/* Selected Services Summary */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-3">Selected Services</h3>
          <div className="space-y-2">
            {selectedServices.map(serviceId => {
              const service = HOSPITAL_SERVICES.find(s => s.id === serviceId);
              if (!service) return null;
              
              const price = getServicePrice(serviceId, isCoorporate);
              
              return (
                <div key={serviceId} className="flex justify-between items-center text-sm">
                  <span>{service.name}</span>
                  <span className="font-medium">₹{price.toLocaleString()}</span>
                </div>
              );
            })}
            <div className="border-t border-blue-200 pt-2 mt-3">
              <div className="flex justify-between items-center font-bold text-blue-900">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {isCoorporate ? 'Corporate Rate Applied' : 'General Rate'}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID / Name *
              </label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter patient name or ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time *
              </label>
              <input
                type="time"
                required
                value={formData.scheduledTime}
                onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special instructions or notes..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Booking...' : `Book Services (₹${totalAmount.toLocaleString()})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServicesManagement;