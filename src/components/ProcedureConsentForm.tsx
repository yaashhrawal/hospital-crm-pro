import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { PatientWithRelations } from '../config/supabaseNew';

interface ProcedureConsentFormProps {
  patient?: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (consentData: any) => void;
}

const ProcedureConsentForm: React.FC<ProcedureConsentFormProps> = ({ 
  patient, 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    // Patient Information
    patientName: '',
    department: '',
    uhidNo: '',
    ipNo: '',
    ageSex: '',
    doctorName: '',
    
    // Consent Details
    authorizedDoctor: '',
    procedureReason: '',
    alternatives: '',
    specificRisks: '',
    
    // Signature Details
    signatureName: '',
    relationship: '',
    patientSignature: '',
    patientDate: '',
    patientTime: '',
    witnessName: '',
    witnessSignature: '',
    doctorSignatureName: '',
    doctorSignature: '',
    doctorDate: '',
    doctorTime: ''
  });

  useEffect(() => {
    if (patient && isOpen) {
      // Pre-populate form with patient data
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const timeStr = today.toTimeString().slice(0, 5);
      
      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name} ${patient.last_name}`,
        uhidNo: patient.patient_id,
        ageSex: `${patient.age || 'N/A'} / ${patient.gender}`,
        doctorName: patient.assigned_doctor || '',
        patientDate: dateStr,
        patientTime: timeStr,
        doctorDate: dateStr,
        doctorTime: timeStr,
        signatureName: `${patient.first_name} ${patient.last_name}`,
        relationship: 'Self'
      }));
    }
  }, [patient, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const requiredFields = [
      'patientName', 'department', 'uhidNo', 'ipNo', 'ageSex', 'doctorName',
      'authorizedDoctor', 'procedureReason', 'alternatives', 'specificRisks',
      'signatureName', 'relationship', 'patientSignature', 'patientDate', 'patientTime',
      'witnessName', 'witnessSignature', 'doctorSignatureName', 'doctorSignature',
      'doctorDate', 'doctorTime'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Log form data and show success message
    console.log('Procedure Consent Form Data:', formData);
    toast.success('Procedure consent form submitted successfully!');
    
    // Call onSubmit callback if provided
    if (onSubmit) {
      onSubmit(formData);
    }
    
    // Close the form
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PROCEDURE CONSENT</h1>
            <h2 className="text-2xl font-semibold text-blue-700 mb-1">VALANT HOSPITAL</h2>
            <p className="text-gray-600">10, Madhav Vihar, Shobhagpura, Udaipur</p>
            <p className="text-gray-600">+91-911911 8000</p>
          </div>
          
          {/* Form Start */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information Section */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient's Name</label>
                  <input 
                    type="text" 
                    name="patientName" 
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter patient's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    name="department" 
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter department name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UHID No.</label>
                  <input 
                    type="text" 
                    name="uhidNo" 
                    value={formData.uhidNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter UHID number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP No.</label>
                  <input 
                    type="text" 
                    name="ipNo" 
                    value={formData.ipNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter IP number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age/Sex</label>
                  <input 
                    type="text" 
                    name="ageSex" 
                    value={formData.ageSex}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 45 years / Male"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name of Doctor</label>
                  <input 
                    type="text" 
                    name="doctorName" 
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter doctor's name"
                  />
                </div>
              </div>
            </div>
            
            {/* Consent Statements Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Consent Details</h3>
              
              <div className="space-y-2">
                <p className="text-gray-700">I hereby authorize Dr. 
                  <input 
                    type="text" 
                    name="authorizedDoctor" 
                    value={formData.authorizedDoctor}
                    onChange={handleInputChange}
                    required
                    className="inline-block w-64 px-2 py-1 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none ml-2 mr-2"
                    placeholder="Doctor's name"
                  />
                  and / or alternative necessary to treat my condition:
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-700">I understand the Name/Reason for the procedure is 
                  <input 
                    type="text" 
                    name="procedureReason" 
                    value={formData.procedureReason}
                    onChange={handleInputChange}
                    required
                    className="inline-block w-96 px-2 py-1 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none ml-2"
                    placeholder="Procedure name/reason"
                  />
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-700">Alternatives to not performing this procedure include: 
                  <input 
                    type="text" 
                    name="alternatives" 
                    value={formData.alternatives}
                    onChange={handleInputChange}
                    required
                    className="inline-block w-96 px-2 py-1 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none ml-2"
                    placeholder="List alternatives"
                  />
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-700">Significant and substantial risk of this particular procedure include: 
                  <input 
                    type="text" 
                    name="specificRisks" 
                    value={formData.specificRisks}
                    onChange={handleInputChange}
                    required
                    className="inline-block w-96 px-2 py-1 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none ml-2"
                    placeholder="List specific risks"
                  />
                </p>
              </div>
            </div>
            
            {/* Detailed Consent Paragraphs */}
            <div className="bg-blue-50 rounded-lg p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                I understand the reason for the procedure. Treatment is being carried in good faith and in my patient's best interest. 
                All feasible alternative treatments, or procedures, including the option of taking no action, with description of 
                material risk and potential complications associated with the alternatives have been explained to me. The relative 
                probability of success for the treatment of procedure in understandable terms, have been explained to me.
              </p>
              
              <p className="text-gray-700 leading-relaxed">
                It has been explained to me that condition may arise during this procedure whereby a different procedure or an 
                additional procedure may need to be performed and I authorize my physician and his assistants to do what they 
                feel is needed and necessary.
              </p>
              
              <p className="text-gray-700 leading-relaxed">
                I understand that no guarantee or assurance has been made as to the results of the procedure and that may not 
                cure the condition.
              </p>
            </div>
            
            {/* Risk Statement */}
            <div className="bg-red-50 rounded-lg p-6">
              <p className="text-gray-700">
                <span className="font-bold">Risks:</span> This authorization is given with understanding that any procedure involves 
                some risks and hazards. Like infection, bleeding, nerve injury, blood clots, Heart attack, allergic reactions 
                and pneumonia. They can be serious and possibly fatal. My physician has explained specific risk of this 
                procedure to me.
              </p>
            </div>
            
            {/* HIV/Hepatitis Consent */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <p className="text-gray-700">
                <span className="font-bold">HIV Test/Hepatitis B and C:</span> I hereby consent to HIV/Hepatitis B and C testing 
                of my blood if deemed necessary for the procedure subject to maintenance of confidentiality.
              </p>
            </div>
            
            {/* Medication Consent */}
            <div className="bg-green-50 rounded-lg p-6">
              <p className="text-gray-700">
                I give my consent to purchase & use medication required during treatment.
              </p>
            </div>
            
            {/* Declaration */}
            <div className="bg-gray-100 rounded-lg p-6">
              <p className="text-gray-700 font-medium">
                I certify that I have read and fully understood the above consent after adequate explanations were given to me 
                in a language that I understand and after all blanks were filled in or crossed out before I signed.
              </p>
            </div>
            
            {/* Signature Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Signatures</h3>
              
              {/* Patient/Relative Signature */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-800 mb-4">Patient/Relative Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name of Patient/Relatives</label>
                    <input 
                      type="text" 
                      name="signatureName" 
                      value={formData.signatureName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship with patient</label>
                    <input 
                      type="text" 
                      name="relationship" 
                      value={formData.relationship}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Self, Father, Mother"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                    <input 
                      type="text" 
                      name="patientSignature" 
                      value={formData.patientSignature}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none bg-transparent"
                      placeholder="Type full name as signature"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input 
                        type="date" 
                        name="patientDate" 
                        value={formData.patientDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                      <input 
                        type="time" 
                        name="patientTime" 
                        value={formData.patientTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Witness Signature */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-800 mb-4">Witness Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name of Witness</label>
                    <input 
                      type="text" 
                      name="witnessName" 
                      value={formData.witnessName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter witness name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                    <input 
                      type="text" 
                      name="witnessSignature" 
                      value={formData.witnessSignature}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none bg-transparent"
                      placeholder="Type full name as signature"
                    />
                  </div>
                </div>
              </div>
              
              {/* Doctor's Signature */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-800 mb-4">Doctor's Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name of Doctor</label>
                    <input 
                      type="text" 
                      name="doctorSignatureName" 
                      value={formData.doctorSignatureName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter doctor's name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                    <input 
                      type="text" 
                      name="doctorSignature" 
                      value={formData.doctorSignature}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none bg-transparent"
                      placeholder="Type full name as signature"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      name="doctorDate" 
                      value={formData.doctorDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input 
                      type="time" 
                      name="doctorTime" 
                      value={formData.doctorTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-center space-x-4 mt-8">
              <button 
                type="submit" 
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-colors"
              >
                Submit Consent
              </button>
              <button 
                type="button" 
                onClick={handlePrint} 
                className="px-8 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors"
              >
                Print Form
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="px-8 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcedureConsentForm;