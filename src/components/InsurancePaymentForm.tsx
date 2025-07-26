import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface InsurancePaymentFormProps {
  amount: number;
  onSave: (insuranceData: InsuranceData) => void;
  onCancel: () => void;
}

interface InsuranceData {
  policy_holder_name: string;
  policy_number: string;
  insurance_company: string;
  policy_type: 'INDIVIDUAL' | 'FAMILY' | 'GROUP' | 'CORPORATE';
  tpa_name?: string;
  authorization_code?: string;
  coverage_amount: number;
  deductible_amount: number;
  copay_percentage: number;
  copay_amount: number;
  claim_number?: string;
  
  // Credit card details for copay/deductible
  card_number?: string;
  card_holder_name?: string;
  expiry_month?: string;
  expiry_year?: string;
  cvv?: string;
  
  // Additional details
  patient_relation: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
  employee_id?: string;
  remarks?: string;
}

const InsurancePaymentForm: React.FC<InsurancePaymentFormProps> = ({
  amount,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<InsuranceData>({
    policy_holder_name: '',
    policy_number: '',
    insurance_company: '',
    policy_type: 'INDIVIDUAL',
    coverage_amount: amount,
    deductible_amount: 0,
    copay_percentage: 0,
    copay_amount: 0,
    patient_relation: 'SELF'
  });

  const [showCardDetails, setShowCardDetails] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate copay amount when percentage changes
  const handleCopayPercentageChange = (percentage: number) => {
    const copayAmount = (amount * percentage) / 100;
    setFormData({
      ...formData,
      copay_percentage: percentage,
      copay_amount: copayAmount
    });
  };

  // Calculate coverage after deductible and copay
  const calculateInsuranceCoverage = () => {
    const afterDeductible = Math.max(0, amount - formData.deductible_amount);
    const afterCopay = afterDeductible - formData.copay_amount;
    return Math.max(0, afterCopay);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.policy_holder_name.trim()) {
      toast.error('Policy holder name is required');
      return;
    }
    
    if (!formData.policy_number.trim()) {
      toast.error('Policy number is required');
      return;
    }
    
    if (!formData.insurance_company.trim()) {
      toast.error('Insurance company name is required');
      return;
    }

    if (formData.coverage_amount <= 0) {
      toast.error('Coverage amount must be greater than 0');
      return;
    }

    // If there's a copay amount and card payment is selected
    if (formData.copay_amount > 0 && showCardDetails) {
      if (!formData.card_number || !formData.card_holder_name || !formData.expiry_month || !formData.expiry_year || !formData.cvv) {
        toast.error('Please fill all card details for copay payment');
        return;
      }
    }

    setLoading(true);
    try {
      onSave(formData);
      toast.success('Insurance details saved successfully');
    } catch (error) {
      toast.error('Failed to save insurance details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">🏥 Insurance Payment Details</h2>
            <p className="text-indigo-100">
              Bill Amount: ₹{amount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:text-indigo-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Policy Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Policy Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Holder Name *
                </label>
                <input
                  type="text"
                  value={formData.policy_holder_name}
                  onChange={(e) => setFormData({ ...formData, policy_holder_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter policy holder name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Number *
                </label>
                <input
                  type="text"
                  value={formData.policy_number}
                  onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter policy number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Company *
                </label>
                <input
                  type="text"
                  value={formData.insurance_company}
                  onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter insurance company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Type
                </label>
                <select
                  value={formData.policy_type}
                  onChange={(e) => setFormData({ ...formData, policy_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="FAMILY">Family</option>
                  <option value="GROUP">Group</option>
                  <option value="CORPORATE">Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TPA Name (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.tpa_name || ''}
                  onChange={(e) => setFormData({ ...formData, tpa_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Third Party Administrator"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Relation to Policy Holder
                </label>
                <select
                  value={formData.patient_relation}
                  onChange={(e) => setFormData({ ...formData, patient_relation: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="SELF">Self</option>
                  <option value="SPOUSE">Spouse</option>
                  <option value="CHILD">Child</option>
                  <option value="PARENT">Parent</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Authorization Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Authorization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Authorization Code
                </label>
                <input
                  type="text"
                  value={formData.authorization_code || ''}
                  onChange={(e) => setFormData({ ...formData, authorization_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Pre-authorization code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim Number
                </label>
                <input
                  type="text"
                  value={formData.claim_number || ''}
                  onChange={(e) => setFormData({ ...formData, claim_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Insurance claim number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID (if corporate policy)
                </label>
                <input
                  type="text"
                  value={formData.employee_id || ''}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Employee ID"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Bill Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deductible Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.deductible_amount}
                  onChange={(e) => setFormData({ ...formData, deductible_amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Copay Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.copay_percentage}
                  onChange={(e) => handleCopayPercentageChange(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Copay Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.copay_amount}
                  onChange={(e) => setFormData({ ...formData, copay_amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
            </div>

            {/* Coverage Summary */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Coverage Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Insurance Coverage:</span>
                  <div className="font-bold text-blue-800">₹{calculateInsuranceCoverage().toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Patient Responsibility:</span>
                  <div className="font-bold text-blue-800">₹{(formData.deductible_amount + formData.copay_amount).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Total Verified:</span>
                  <div className="font-bold text-blue-800">₹{(calculateInsuranceCoverage() + formData.deductible_amount + formData.copay_amount).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Payment (if copay/deductible) */}
          {(formData.copay_amount > 0 || formData.deductible_amount > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Patient Payment (₹{(formData.copay_amount + formData.deductible_amount).toLocaleString()})
              </h3>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showCardDetails}
                    onChange={(e) => setShowCardDetails(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Pay patient portion by credit/debit card</span>
                </label>
              </div>

              {showCardDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={formData.card_number || ''}
                      onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.card_holder_name || ''}
                      onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Name on card"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Month
                      </label>
                      <select
                        value={formData.expiry_month || ''}
                        onChange={(e) => setFormData({ ...formData, expiry_month: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Year
                      </label>
                      <select
                        value={formData.expiry_year || ''}
                        onChange={(e) => setFormData({ ...formData, expiry_year: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={formData.cvv || ''}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Remarks
            </label>
            <textarea
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Any additional notes or remarks"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Insurance Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InsurancePaymentForm;