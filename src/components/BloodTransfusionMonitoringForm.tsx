import React, { useState, useEffect } from 'react';
import { X, Printer, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

interface MonitoringEntry {
  id: string;
  time: string;
  pulse: string;
  bloodPressure: string;
  spo2: string;
  temp: string;
  rateOfFlow: string;
  remark: string;
}

interface BloodTransfusionFormData {
  // Patient Details
  patientName: string;
  patientId: string;
  ipdNo: string;
  age: string;
  sex: string;
  room: string;
  bedNo: string;

  // Blood Product Details
  bloodGroup: string;
  bloodBagNo: string;
  doc: string;
  doe: string;
  typeOfBloodProduct: string;
  bloodProductCheckedBy: string;
  doctorNameSignature: string;
  staffNameSignature: string;

  // Pre-Transfusion Vitals
  preTemp: string;
  preBP: string;
  preRR: string;
  preSPO2: string;
  prePulse: string;
  startTime: string;
  endTime: string;
  rateOfFlow: string;

  // Monitoring Table
  monitoringEntries: MonitoringEntry[];

  // Post Transfusion Vitals
  post15MinTemp: string;
  post15MinBP: string;
  post15MinRR: string;
  post15MinSPO2: string;
  post15MinPulse: string;

  post30MinTemp: string;
  post30MinBP: string;
  post30MinRR: string;
  post30MinSPO2: string;
  post30MinPulse: string;

  post60MinTemp: string;
  post60MinBP: string;
  post60MinRR: string;
  post60MinSPO2: string;
  post60MinPulse: string;

  // Complications and Signatures
  complications: string;
  informedTo: string;
  informedAt: string;
  dateTime: string;
  advisedFor: string;

  // Final Signature
  monitoringDoneBy: string;
  finalDate: string;
  finalTime: string;
}

interface BloodTransfusionMonitoringFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BloodTransfusionFormData) => void;
  patient?: any;
  bedNumber?: number;
  ipdNumber?: string;
  initialData?: BloodTransfusionFormData;
}

const BloodTransfusionMonitoringForm: React.FC<BloodTransfusionMonitoringFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patient,
  bedNumber,
  ipdNumber,
  initialData
}) => {
  const [formData, setFormData] = useState<BloodTransfusionFormData>(() => ({
    // Patient Details - Auto-populated from patient data
    patientName: initialData?.patientName || (patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : ''),
    patientId: initialData?.patientId || patient?.patient_id || '',
    ipdNo: initialData?.ipdNo || ipdNumber || '',
    age: initialData?.age || patient?.age?.toString() || '',
    sex: initialData?.sex || patient?.gender || '',
    room: initialData?.room || (patient?.address ? patient.address.split(',')[0] : ''), // Use first part of address as room hint
    bedNo: initialData?.bedNo || bedNumber?.toString() || '',

    // Blood Product Details - Auto-populated with patient's blood group if available
    bloodGroup: initialData?.bloodGroup || patient?.blood_group || '',
    bloodBagNo: initialData?.bloodBagNo || '',
    doc: initialData?.doc || '',
    doe: initialData?.doe || '',
    typeOfBloodProduct: initialData?.typeOfBloodProduct || '',
    bloodProductCheckedBy: initialData?.bloodProductCheckedBy || '',
    doctorNameSignature: initialData?.doctorNameSignature || '',
    staffNameSignature: initialData?.staffNameSignature || '',

    // Pre-Transfusion Vitals
    preTemp: initialData?.preTemp || '',
    preBP: initialData?.preBP || '',
    preRR: initialData?.preRR || '',
    preSPO2: initialData?.preSPO2 || '',
    prePulse: initialData?.prePulse || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    rateOfFlow: initialData?.rateOfFlow || '',

    // Monitoring Table - Default entries
    monitoringEntries: initialData?.monitoringEntries || [
      { id: '1', time: 'At 15 Min', pulse: '', bloodPressure: '', spo2: '', temp: '', rateOfFlow: '', remark: '' },
      { id: '2', time: 'At 30 Min', pulse: '', bloodPressure: '', spo2: '', temp: '', rateOfFlow: '', remark: '' },
      { id: '3', time: 'At 45 Min', pulse: '', bloodPressure: '', spo2: '', temp: '', rateOfFlow: '', remark: '' },
      { id: '4', time: 'At 60 Min', pulse: '', bloodPressure: '', spo2: '', temp: '', rateOfFlow: '', remark: '' },
      { id: '5', time: 'At 90 Min', pulse: '', bloodPressure: '', spo2: '', temp: '', rateOfFlow: '', remark: '' },
    ],

    // Post Transfusion Vitals
    post15MinTemp: initialData?.post15MinTemp || '',
    post15MinBP: initialData?.post15MinBP || '',
    post15MinRR: initialData?.post15MinRR || '',
    post15MinSPO2: initialData?.post15MinSPO2 || '',
    post15MinPulse: initialData?.post15MinPulse || '',

    post30MinTemp: initialData?.post30MinTemp || '',
    post30MinBP: initialData?.post30MinBP || '',
    post30MinRR: initialData?.post30MinRR || '',
    post30MinSPO2: initialData?.post30MinSPO2 || '',
    post30MinPulse: initialData?.post30MinPulse || '',

    post60MinTemp: initialData?.post60MinTemp || '',
    post60MinBP: initialData?.post60MinBP || '',
    post60MinRR: initialData?.post60MinRR || '',
    post60MinSPO2: initialData?.post60MinSPO2 || '',
    post60MinPulse: initialData?.post60MinPulse || '',

    // Complications and Signatures
    complications: initialData?.complications || '',
    informedTo: initialData?.informedTo || (patient?.emergency_contact_name ? `${patient.emergency_contact_name} (${patient.emergency_contact_phone || 'No phone'})` : ''),
    informedAt: initialData?.informedAt || '',
    dateTime: initialData?.dateTime || new Date().toISOString().slice(0, 16), // Auto-fill current date and time
    advisedFor: initialData?.advisedFor || '',

    // Final Signature
    monitoringDoneBy: initialData?.monitoringDoneBy || '',
    finalDate: initialData?.finalDate || new Date().toISOString().split('T')[0],
    finalTime: initialData?.finalTime || new Date().toTimeString().slice(0, 5),
  }));

  // Show notification when patient data is auto-populated
  useEffect(() => {
    if (isOpen && patient && !initialData) {
      const autoPopulatedFields = [];
      if (patient.patient_id) autoPopulatedFields.push('Patient ID');
      if (patient.blood_group) autoPopulatedFields.push('Blood Group');
      if (patient.emergency_contact_name) autoPopulatedFields.push('Emergency Contact');
      if (ipdNumber) autoPopulatedFields.push('IPD No.');
      
      if (autoPopulatedFields.length > 0) {
        toast.success(`Auto-populated: ${autoPopulatedFields.join(', ')}`, {
          duration: 4000,
          icon: '🏥'
        });
      }
    }
  }, [isOpen, patient, initialData, ipdNumber]);

  // Helper function to check if a field was auto-populated
  const isAutoPopulated = (fieldName: string, fieldValue: string) => {
    if (!patient || initialData) return false;
    
    switch (fieldName) {
      case 'patientId':
        return fieldValue === patient.patient_id;
      case 'ipdNo':
        return fieldValue === ipdNumber;
      case 'patientName':
        return fieldValue === `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      case 'age':
        return fieldValue === patient.age?.toString();
      case 'sex':
        return fieldValue === patient.gender;
      case 'bloodGroup':
        return fieldValue === patient.blood_group;
      case 'informedTo':
        return fieldValue && patient.emergency_contact_name && fieldValue.includes(patient.emergency_contact_name);
      default:
        return false;
    }
  };

  const handleInputChange = (field: keyof BloodTransfusionFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMonitoringEntryChange = (id: string, field: keyof MonitoringEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      monitoringEntries: prev.monitoringEntries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const addMonitoringEntry = () => {
    const newEntry: MonitoringEntry = {
      id: Date.now().toString(),
      time: '',
      pulse: '',
      bloodPressure: '',
      spo2: '',
      temp: '',
      rateOfFlow: '',
      remark: ''
    };
    setFormData(prev => ({
      ...prev,
      monitoringEntries: [...prev.monitoringEntries, newEntry]
    }));
  };

  const removeMonitoringEntry = (id: string) => {
    if (formData.monitoringEntries.length > 1) {
      setFormData(prev => ({
        ...prev,
        monitoringEntries: prev.monitoringEntries.filter(entry => entry.id !== id)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }

    if (!formData.bloodGroup.trim()) {
      toast.error('Blood group is required');
      return;
    }

    onSubmit(formData);
    toast.success('Blood Transfusion Monitoring Form saved successfully!');
    onClose();
  };

  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; font-size: 12px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; color: #333; font-size: 24px;">BLOOD TRANSFUSION MONITORING FORM</h1>
          <p style="margin: 5px 0; color: #666;">Comprehensive Blood Transfusion Monitoring & Documentation</p>
        </div>
        
        <!-- Patient Details -->
        <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Patient Details</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div><strong>Patient's Name:</strong> ${formData.patientName}</div>
            <div><strong>Patient ID:</strong> ${formData.patientId}</div>
            <div><strong>IPD No.:</strong> ${formData.ipdNo}</div>
            <div><strong>Age:</strong> ${formData.age}</div>
            <div><strong>Sex:</strong> ${formData.sex}</div>
            <div><strong>Room:</strong> ${formData.room}</div>
            <div><strong>Bed No.:</strong> ${formData.bedNo}</div>
          </div>
        </div>

        <!-- Instructions -->
        <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; background-color: #f9f9f9;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Instructions for Blood Transfusion</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Check patient identity and blood product compatibility before starting transfusion</li>
            <li>Monitor vital signs every 15 minutes during transfusion and record observations</li>
            <li>Watch for any adverse reactions and stop transfusion immediately if complications arise</li>
            <li>Complete post-transfusion monitoring and documentation as per protocol</li>
          </ul>
        </div>

        <!-- Blood Product Details -->
        <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Blood Product Details</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
            <div><strong>Blood Group:</strong> ${formData.bloodGroup}</div>
            <div><strong>Blood Bag No.:</strong> ${formData.bloodBagNo}</div>
            <div><strong>DOC:</strong> ${formData.doc}</div>
            <div><strong>DOE:</strong> ${formData.doe}</div>
            <div style="grid-column: span 2;"><strong>Type of Blood Product:</strong> ${formData.typeOfBloodProduct}</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div><strong>Blood/Blood Product Checked by:</strong> ${formData.bloodProductCheckedBy}</div>
            <div><strong>Doctor Name & Signature:</strong> ${formData.doctorNameSignature}</div>
            <div><strong>Staff Name & Signature:</strong> ${formData.staffNameSignature}</div>
          </div>
        </div>

        <!-- Pre-Transfusion Vitals -->
        <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Pre Transfusion Vitals</h3>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 15px;">
            <div><strong>Temp:</strong> ${formData.preTemp}°F</div>
            <div><strong>BP:</strong> ${formData.preBP} mm Hg</div>
            <div><strong>RR:</strong> ${formData.preRR}/min</div>
            <div><strong>SPO2:</strong> ${formData.preSPO2}%</div>
            <div><strong>Pulse:</strong> ${formData.prePulse}/min</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div><strong>Start Time:</strong> ${formData.startTime}</div>
            <div><strong>End Time:</strong> ${formData.endTime}</div>
            <div><strong>Rate of Flow:</strong> ${formData.rateOfFlow}</div>
          </div>
        </div>

        <!-- Monitoring Table -->
        <div style="margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Blood Transfusion Monitoring</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">S No.</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Time</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Pulse</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Blood Pressure (mm Hg)</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">SPO2</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Temp</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Rate of Flow</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Remark</th>
              </tr>
            </thead>
            <tbody>
              ${formData.monitoringEntries.map((entry, index) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${entry.time}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${entry.pulse}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${entry.bloodPressure}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${entry.spo2}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${entry.temp}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${entry.rateOfFlow}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${entry.remark}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Post Transfusion Vitals -->
        <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Post Transfusion Vitals</h3>
          
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #555;">After 15 Minutes</h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
              <div><strong>Temp:</strong> ${formData.post15MinTemp}°F</div>
              <div><strong>BP:</strong> ${formData.post15MinBP} mm Hg</div>
              <div><strong>RR:</strong> ${formData.post15MinRR}/min</div>
              <div><strong>SPO2:</strong> ${formData.post15MinSPO2}%</div>
              <div><strong>Pulse:</strong> ${formData.post15MinPulse}/min</div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #555;">After 30 Minutes</h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
              <div><strong>Temp:</strong> ${formData.post30MinTemp}°F</div>
              <div><strong>BP:</strong> ${formData.post30MinBP} mm Hg</div>
              <div><strong>RR:</strong> ${formData.post30MinRR}/min</div>
              <div><strong>SPO2:</strong> ${formData.post30MinSPO2}%</div>
              <div><strong>Pulse:</strong> ${formData.post30MinPulse}/min</div>
            </div>
          </div>
          
          <div>
            <h4 style="margin: 0 0 10px 0; color: #555;">At 60 Minutes</h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
              <div><strong>Temp:</strong> ${formData.post60MinTemp}°F</div>
              <div><strong>BP:</strong> ${formData.post60MinBP} mm Hg</div>
              <div><strong>RR:</strong> ${formData.post60MinRR}/min</div>
              <div><strong>SPO2:</strong> ${formData.post60MinSPO2}%</div>
              <div><strong>Pulse:</strong> ${formData.post60MinPulse}/min</div>
            </div>
          </div>
        </div>

        <!-- Complications -->
        <div style="margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">Complications and Final Details</h3>
          <div style="margin-bottom: 15px;">
            <strong>Description of any complications:</strong><br>
            <div style="border: 1px solid #ddd; padding: 10px; margin-top: 5px; min-height: 60px; background-color: #f9f9f9;">
              ${formData.complications.replace(/\n/g, '<br>')}
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
            <div><strong>Informed to:</strong> ${formData.informedTo}</div>
            <div><strong>At:</strong> ${formData.informedAt}</div>
            <div><strong>Date & Time:</strong> ${formData.dateTime ? new Date(formData.dateTime).toLocaleDateString('en-IN') + ' ' + new Date(formData.dateTime).toLocaleTimeString('en-IN') : ''}</div>
          </div>
          <div><strong>Advised for:</strong> ${formData.advisedFor}</div>
          <div style="float: right; border: 1px dashed #999; padding: 20px; margin-top: 15px; text-align: center; background-color: #f9f9f9;">
            <strong>Tag of Blood Product</strong><br>
            <div style="margin-top: 10px; font-size: 10px; color: #666;">
              (Attach blood product tag here)
            </div>
          </div>
        </div>

        <!-- Final Signature -->
        <div style="margin-top: 40px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
          <div style="margin-bottom: 15px;">
            <strong>Monitoring Done By: Name & Signature (Staff Nurse):</strong> ${formData.monitoringDoneBy}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
            <div><strong>Date:</strong> ${formData.finalDate ? new Date(formData.finalDate).toLocaleDateString('en-IN') : ''}</div>
            <div><strong>Time:</strong> ${formData.finalTime}</div>
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
          Blood Transfusion Monitoring Form - Generated on ${new Date().toLocaleDateString('en-IN')}
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Blood Transfusion Monitoring Form - ${formData.patientName}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; size: A4; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <span className="text-2xl">🩸</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Blood Transfusion Monitoring Form</h2>
              <p className="text-sm text-gray-600">Comprehensive blood transfusion monitoring and documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Patient Details Header */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Patient Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient's Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient ID
                    {isAutoPopulated('patientId', formData.patientId) && (
                      <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        ✓ Auto-filled
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => handleInputChange('patientId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IPD No.
                  </label>
                  <input
                    type="text"
                    value={formData.ipdNo}
                    onChange={(e) => handleInputChange('ipdNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sex
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => handleInputChange('room', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bed No.
                  </label>
                  <input
                    type="text"
                    value={formData.bedNo}
                    onChange={(e) => handleInputChange('bedNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Instructions for Blood Transfusion
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
                <li>Check patient identity and blood product compatibility before starting transfusion</li>
                <li>Monitor vital signs every 15 minutes during transfusion and record observations</li>
                <li>Watch for any adverse reactions and stop transfusion immediately if complications arise</li>
                <li>Complete post-transfusion monitoring and documentation as per protocol</li>
              </ul>
            </div>

            {/* Blood Product Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Blood Product Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group *
                  </label>
                  <input
                    type="text"
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., A+, B-, O+, AB-"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Bag No.
                  </label>
                  <input
                    type="text"
                    value={formData.bloodBagNo}
                    onChange={(e) => handleInputChange('bloodBagNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DOC (Date of Collection)
                  </label>
                  <input
                    type="date"
                    value={formData.doc}
                    onChange={(e) => handleInputChange('doc', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DOE (Date of Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.doe}
                    onChange={(e) => handleInputChange('doe', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type of Blood Product (PRBC/Platelets/FFP/Other)
                  </label>
                  <input
                    type="text"
                    value={formData.typeOfBloodProduct}
                    onChange={(e) => handleInputChange('typeOfBloodProduct', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., PRBC, Platelets, FFP, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood/Blood Product Checked by
                  </label>
                  <input
                    type="text"
                    value={formData.bloodProductCheckedBy}
                    onChange={(e) => handleInputChange('bloodProductCheckedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doctor Name & Signature
                  </label>
                  <input
                    type="text"
                    value={formData.doctorNameSignature}
                    onChange={(e) => handleInputChange('doctorNameSignature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Name & Signature
                  </label>
                  <input
                    type="text"
                    value={formData.staffNameSignature}
                    onChange={(e) => handleInputChange('staffNameSignature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Pre-Transfusion Vitals */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Pre Transfusion Vitals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temp (°F)
                  </label>
                  <input
                    type="text"
                    value={formData.preTemp}
                    onChange={(e) => handleInputChange('preTemp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="98.6"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    BP (mm of Hg)
                  </label>
                  <input
                    type="text"
                    value={formData.preBP}
                    onChange={(e) => handleInputChange('preBP', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RR (/min)
                  </label>
                  <input
                    type="text"
                    value={formData.preRR}
                    onChange={(e) => handleInputChange('preRR', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="16-20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SPO2 (%)
                  </label>
                  <input
                    type="text"
                    value={formData.preSPO2}
                    onChange={(e) => handleInputChange('preSPO2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="98-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pulse (/min)
                  </label>
                  <input
                    type="text"
                    value={formData.prePulse}
                    onChange={(e) => handleInputChange('prePulse', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="60-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Transfusion Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Transfusion End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate of Flow
                  </label>
                  <input
                    type="text"
                    value={formData.rateOfFlow}
                    onChange={(e) => handleInputChange('rateOfFlow', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="e.g., 10-15 drops/min"
                  />
                </div>
              </div>
            </div>

            {/* Blood Transfusion Monitoring Table */}
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Blood Transfusion Monitoring
                </h3>
                <button
                  type="button"
                  onClick={addMonitoringEntry}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">S No.</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Time</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Pulse</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Blood Pressure (mm Hg)</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">SPO2</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Temp</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Rate of Flow</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Remark</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.monitoringEntries.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.time}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'time', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="e.g., At 15 Min"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.pulse}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'pulse', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="e.g., 72"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.bloodPressure}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'bloodPressure', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="e.g., 120/80"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.spo2}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'spo2', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="e.g., 98%"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.temp}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'temp', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="e.g., 98.6°F"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.rateOfFlow}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'rateOfFlow', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="e.g., 15 drops/min"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <input
                            type="text"
                            value={entry.remark}
                            onChange={(e) => handleMonitoringEntryChange(entry.id, 'remark', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            placeholder="Observations"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {formData.monitoringEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMonitoringEntry(entry.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove entry"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Post Transfusion Vitals */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Post Transfusion Vitals
              </h3>
              
              {/* After 15 Minutes */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">After 15 Minutes</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°F)</label>
                    <input
                      type="text"
                      value={formData.post15MinTemp}
                      onChange={(e) => handleInputChange('post15MinTemp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BP (mm of Hg)</label>
                    <input
                      type="text"
                      value={formData.post15MinBP}
                      onChange={(e) => handleInputChange('post15MinBP', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RR (/min)</label>
                    <input
                      type="text"
                      value={formData.post15MinRR}
                      onChange={(e) => handleInputChange('post15MinRR', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SPO2 (%)</label>
                    <input
                      type="text"
                      value={formData.post15MinSPO2}
                      onChange={(e) => handleInputChange('post15MinSPO2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (/min)</label>
                    <input
                      type="text"
                      value={formData.post15MinPulse}
                      onChange={(e) => handleInputChange('post15MinPulse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* After 30 Minutes */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3">After 30 Minutes</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°F)</label>
                    <input
                      type="text"
                      value={formData.post30MinTemp}
                      onChange={(e) => handleInputChange('post30MinTemp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BP (mm of Hg)</label>
                    <input
                      type="text"
                      value={formData.post30MinBP}
                      onChange={(e) => handleInputChange('post30MinBP', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RR (/min)</label>
                    <input
                      type="text"
                      value={formData.post30MinRR}
                      onChange={(e) => handleInputChange('post30MinRR', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SPO2 (%)</label>
                    <input
                      type="text"
                      value={formData.post30MinSPO2}
                      onChange={(e) => handleInputChange('post30MinSPO2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (/min)</label>
                    <input
                      type="text"
                      value={formData.post30MinPulse}
                      onChange={(e) => handleInputChange('post30MinPulse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* At 60 Minutes */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">At 60 Minutes</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°F)</label>
                    <input
                      type="text"
                      value={formData.post60MinTemp}
                      onChange={(e) => handleInputChange('post60MinTemp', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BP (mm of Hg)</label>
                    <input
                      type="text"
                      value={formData.post60MinBP}
                      onChange={(e) => handleInputChange('post60MinBP', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RR (/min)</label>
                    <input
                      type="text"
                      value={formData.post60MinRR}
                      onChange={(e) => handleInputChange('post60MinRR', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SPO2 (%)</label>
                    <input
                      type="text"
                      value={formData.post60MinSPO2}
                      onChange={(e) => handleInputChange('post60MinSPO2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pulse (/min)</label>
                    <input
                      type="text"
                      value={formData.post60MinPulse}
                      onChange={(e) => handleInputChange('post60MinPulse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Complications and Signatures */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Complications and Final Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description of any complications
                    </label>
                    <textarea
                      value={formData.complications}
                      onChange={(e) => handleInputChange('complications', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      rows={4}
                      placeholder="Describe any complications or adverse reactions observed during transfusion..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Informed to
                      </label>
                      <input
                        type="text"
                        value={formData.informedTo}
                        onChange={(e) => handleInputChange('informedTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        At
                      </label>
                      <input
                        type="text"
                        value={formData.informedAt}
                        onChange={(e) => handleInputChange('informedAt', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dateTime}
                        onChange={(e) => handleInputChange('dateTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advised for
                      </label>
                      <input
                        type="text"
                        value={formData.advisedFor}
                        onChange={(e) => handleInputChange('advisedFor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center bg-gray-100">
                    <div className="text-lg font-medium text-gray-700 mb-2">Tag of Blood Product</div>
                    <div className="text-sm text-gray-500">
                      Attach blood product tag here
                    </div>
                    <div className="mt-4 text-xs text-gray-400">
                      (Physical tag to be attached in printed form)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Signature */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                Final Signature
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monitoring Done By: Name & Signature (Staff Nurse)
                  </label>
                  <input
                    type="text"
                    value={formData.monitoringDoneBy}
                    onChange={(e) => handleInputChange('monitoringDoneBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter staff nurse name and signature"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.finalDate}
                      onChange={(e) => handleInputChange('finalDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.finalTime}
                      onChange={(e) => handleInputChange('finalTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Save Blood Transfusion Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BloodTransfusionMonitoringForm;