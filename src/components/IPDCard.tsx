import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseNew';

interface IPDCardProps {
  admission: any;
  onBack: () => void;
}

const IPDCard: React.FC<IPDCardProps> = ({ admission, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [dischargeSummary, setDischargeSummary] = useState<any>(null);

  useEffect(() => {
    if (admission && admission.status === 'DISCHARGED') {
      fetchDischargeSummary();
    }
  }, [admission]);

  const fetchDischargeSummary = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching discharge summary for admission ID:', admission.id);
      
      const { data, error } = await supabase
        .from('discharge_summaries')
        .select('*')
        .eq('admission_id', admission.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching discharge summary:', error);
        return;
      }

      console.log('📋 Discharge summary data received:', data);
      setDischargeSummary(data);
    } catch (error) {
      console.error('❌ Error fetching discharge summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStayDuration = () => {
    const admissionDate = new Date(admission.admission_date);
    const dischargeDate = admission.actual_discharge_date 
      ? new Date(admission.actual_discharge_date) 
      : new Date();
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseMedications = (medicationString: string) => {
    if (!medicationString) return [];
    
    return medicationString.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split('\t');
        return {
          drug: parts[0] || '',
          morning: parts[1] || '0',
          afternoon: parts[2] || '0',
          night: parts[3] || '0',
          days: parts[4] || '0'
        };
      })
      .filter(med => med.drug.trim());
  };

  const handlePrint = () => {
    // Create a new window with only the discharge card content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Discharge Summary Card</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.4;
              color: #333;
              background: white;
            }
            
            @page {
              margin: 0.5in;
              size: A4;
            }
            
            .print-container {
              max-width: 100%;
              margin: 0;
              padding: 20px;
            }
            
            .hospital-header {
              text-align: center;
              border-bottom: 2px solid #ccc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .hospital-header h1 {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin: 15px 0 10px 0;
            }
            
            .hospital-header .contact-info {
              font-size: 12px;
              color: #666;
              line-height: 1.3;
            }
            
            .discharge-title {
              font-size: 20px;
              font-weight: bold;
              color: #16a34a;
              margin: 20px 0 10px 0;
            }
            
            .status-badge {
              display: inline-block;
              background: #dcfce7;
              color: #166534;
              padding: 8px 16px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin-top: 10px;
            }
            
            .patient-demographics {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            
            .info-section {
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #ccc;
            }
            
            .patient-info {
              background-color: #f8f9ff;
            }
            
            .admission-info {
              background-color: #f8fff8;
            }
            
            .section-title {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 15px;
              color: #333;
            }
            
            .patient-info .section-title {
              color: #1e40af;
            }
            
            .admission-info .section-title {
              color: #16a34a;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
            }
            
            .info-label {
              font-weight: 500;
            }
            
            .info-value {
              font-weight: bold;
            }
            
            .medical-summary {
              background-color: #f8f9ff;
              padding: 20px;
              border-radius: 8px;
              border: 2px solid #bfdbfe;
              margin-bottom: 30px;
            }
            
            .medical-summary-title {
              font-weight: bold;
              font-size: 16px;
              color: #1e40af;
              margin-bottom: 20px;
            }
            
            .field-item {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .field-label {
              font-weight: 500;
              font-size: 14px;
              color: #1e40af;
              margin-bottom: 5px;
            }
            
            .field-content {
              background: white;
              padding: 12px;
              border-radius: 4px;
              border: 1px solid #ccc;
              font-size: 14px;
              color: #333;
            }
            
            .medication-section {
              background-color: #f8fff8;
              padding: 20px;
              border-radius: 8px;
              border: 2px solid #bbf7d0;
              margin-bottom: 30px;
            }
            
            .medication-title {
              font-weight: bold;
              font-size: 16px;
              color: #16a34a;
              margin-bottom: 20px;
            }
            
            .medication-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #666;
              border-radius: 8px;
              overflow: hidden;
              background: white;
            }
            
            .medication-table th,
            .medication-table td {
              border: 1px solid #666;
              padding: 8px 12px;
              text-align: left;
              font-size: 12px;
            }
            
            .medication-table th {
              background-color: #f8f9ff;
              font-weight: bold;
              color: #333;
            }
            
            .medication-table td:nth-child(2),
            .medication-table td:nth-child(3),
            .medication-table td:nth-child(4),
            .medication-table td:nth-child(5),
            .medication-table th:nth-child(2),
            .medication-table th:nth-child(3),
            .medication-table th:nth-child(4),
            .medication-table th:nth-child(5) {
              text-align: center;
            }
            
            .medication-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .medication-note {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- Hospital Header -->
            <div class="hospital-header">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                <img 
                  src="/logo.png" 
                  alt="VALANT Hospital Logo" 
                  style="height: 64px; width: auto; max-height: 64px;"
                />
              </div>
              <div class="contact-info">
                <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
                <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
              </div>
              <div class="discharge-title">DISCHARGE SUMMARY CARD</div>
              <div class="status-badge">✅ PATIENT DISCHARGED - COMPLETE SUMMARY</div>
            </div>

            <!-- Patient Demographics -->
            <div class="patient-demographics">
              <div class="info-section patient-info">
                <div class="section-title">Patient Information</div>
                <div class="info-row">
                  <span class="info-label">Patient ID:</span>
                  <span class="info-value">${admission.patient?.patient_id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${admission.patient?.first_name} ${admission.patient?.last_name}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Age/Gender:</span>
                  <span>${admission.patient?.age || 'N/A'} / ${admission.patient?.gender}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Blood Group:</span>
                  <span>${admission.patient?.blood_group || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Contact:</span>
                  <span>${admission.patient?.phone}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span>${admission.patient?.address || 'N/A'}</span>
                </div>
              </div>

              <div class="info-section admission-info">
                <div class="section-title">Admission Details</div>
                <div class="info-row">
                  <span class="info-label">Admission Date:</span>
                  <span class="info-value">${formatDate(admission.admission_date)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Bed Number:</span>
                  <span class="info-value">${admission.bed_number}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Room Type:</span>
                  <span>${admission.room_type}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Department:</span>
                  <span>${admission.department}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Attending Doctor:</span>
                  <span>${admission.doctor?.name || admission.doctor_name || admission.assigned_doctor || 'Not Assigned'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Specialization:</span>
                  <span>${admission.doctor?.specialization || admission.doctor?.department || admission.department || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Stay Duration:</span>
                  <span class="info-value">${calculateStayDuration()} days</span>
                </div>
              </div>
            </div>

            ${dischargeSummary ? `
              <!-- Medical Discharge Summary -->
              <div class="medical-summary">
                <div class="medical-summary-title">🏥 Medical Discharge Summary</div>
                ${dischargeSummary.final_diagnosis ? `
                  <div class="field-item">
                    <div class="field-label">Final Diagnosis *</div>
                    <div class="field-content">${dischargeSummary.final_diagnosis}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.primary_consultant ? `
                  <div class="field-item">
                    <div class="field-label">Primary Consultant *</div>
                    <div class="field-content">${dischargeSummary.primary_consultant}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.chief_complaints ? `
                  <div class="field-item">
                    <div class="field-label">Chief Complaints</div>
                    <div class="field-content">${dischargeSummary.chief_complaints}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.hopi ? `
                  <div class="field-item">
                    <div class="field-label">HOPI (History of Present Illness)</div>
                    <div class="field-content">${dischargeSummary.hopi}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.past_history ? `
                  <div class="field-item">
                    <div class="field-label">Past History</div>
                    <div class="field-content">${dischargeSummary.past_history}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.investigations ? `
                  <div class="field-item">
                    <div class="field-label">Investigations</div>
                    <div class="field-content">${dischargeSummary.investigations}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.course_of_stay ? `
                  <div class="field-item">
                    <div class="field-label">Course of Stay</div>
                    <div class="field-content">${dischargeSummary.course_of_stay}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.treatment_during_hospitalization ? `
                  <div class="field-item">
                    <div class="field-label">Treatment During Hospitalization</div>
                    <div class="field-content">${dischargeSummary.treatment_during_hospitalization}</div>
                  </div>
                ` : ''}
                ${dischargeSummary.treatment_summary ? `
                  <div class="field-item">
                    <div class="field-label">Treatment Summary *</div>
                    <div class="field-content">${dischargeSummary.treatment_summary}</div>
                  </div>
                ` : ''}
              </div>

              ${dischargeSummary.discharge_medication ? `
                <!-- Discharge Medication -->
                <div class="medication-section">
                  <div class="medication-title">💊 Discharge Medication</div>
                  <table class="medication-table">
                    <thead>
                      <tr>
                        <th>Drug Name & Dose</th>
                        <th>Morning</th>
                        <th>Afternoon</th>
                        <th>Night</th>
                        <th>Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${parseMedications(dischargeSummary.discharge_medication).map((med, index) => `
                        <tr>
                          <td>${med.drug}</td>
                          <td>${med.morning}</td>
                          <td>${med.afternoon}</td>
                          <td>${med.night}</td>
                          <td>${med.days}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <div class="medication-note">
                    📝 Medication details as entered during discharge process
                  </div>
                </div>
              ` : ''}
            ` : `
              <div class="medical-summary">
                <div class="medical-summary-title">⚠️ No Discharge Summary Found</div>
                <div class="field-content">
                  Discharge summary data is not available for this admission. 
                  Please ensure the patient was properly discharged through the discharge process.
                  <br><br>
                  Admission ID: ${admission.id} | Status: ${admission.status}
                </div>
              </div>
            `}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print and close
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading patient journey...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center no-print">
          <div>
            <h2 className="text-xl font-bold">🪪 IPD Patient Card</h2>
            <p className="text-green-100">
              Patient information and current status
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-white text-green-600 px-4 py-2 rounded hover:bg-gray-100"
            >
              🖨️ Print
            </button>
            <button
              onClick={onBack}
              className="text-white hover:text-green-200 text-2xl font-bold"
            >
              ←
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8" id="discharge-card-content">
          {/* Hospital Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6 hospital-header">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="VALANT Hospital Logo" 
                className="h-16 w-auto"
                style={{ maxHeight: '64px', height: 'auto', width: 'auto' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">VALANT HOSPITAL</h1>
            <div className="text-sm text-gray-600">
              <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
              <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-green-600">
                {admission.status === 'DISCHARGED' ? 'DISCHARGE SUMMARY CARD' : 'IPD PATIENT CARD'}
              </h2>
              {admission.status === 'DISCHARGED' && (
                <div className="mt-2 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-lg">
                  ✅ PATIENT DISCHARGED - COMPLETE SUMMARY
                </div>
              )}
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 gap-6 mb-6 patient-demographics">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Patient ID:</span>
                  <span className="font-bold">{admission.patient?.patient_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age/Gender:</span>
                  <span>{admission.patient?.age || 'N/A'} / {admission.patient?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Blood Group:</span>
                  <span>{admission.patient?.blood_group || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Contact:</span>
                  <span>{admission.patient?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Address:</span>
                  <span>{admission.patient?.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-green-800 mb-3">Admission Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Admission Date:</span>
                  <span className="font-bold">{formatDate(admission.admission_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bed Number:</span>
                  <span className="font-bold">{admission.bed_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Room Type:</span>
                  <span>{admission.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Department:</span>
                  <span>{admission.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Attending Doctor:</span>
                  <span>{admission.doctor?.name || admission.doctor_name || admission.assigned_doctor || 'Not Assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Specialization:</span>
                  <span>{admission.doctor?.specialization || admission.doctor?.department || admission.department || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Stay Duration:</span>
                  <span className="font-bold">{calculateStayDuration()} days</span>
                </div>
              </div>
            </div>
          </div>




          {/* Discharge Information - Only show if patient is discharged */}
          {admission.status === 'DISCHARGED' && (
            <>
              {!dischargeSummary ? (
                <div className="mb-6">
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <h3 className="font-bold text-red-800 mb-4">⚠️ No Discharge Summary Found</h3>
                    <p className="text-red-700">
                      Discharge summary data is not available for this admission. 
                      Please ensure the patient was properly discharged through the discharge process.
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      Admission ID: {admission.id} | Status: {admission.status}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Medical Discharge Summary Section */}
                  <div className="mb-6 medical-summary">
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-4">🏥 Medical Discharge Summary</h3>
                      <div className="space-y-4 medical-fields">
                        {dischargeSummary.final_diagnosis && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Final Diagnosis *</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.final_diagnosis}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.primary_consultant && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Primary Consultant *</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.primary_consultant}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.chief_complaints && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Chief Complaints</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.chief_complaints}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.hopi && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">HOPI (History of Present Illness)</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.hopi}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.past_history && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Past History</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.past_history}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.investigations && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Investigations</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.investigations}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.course_of_stay && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Course of Stay</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.course_of_stay}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.treatment_during_hospitalization && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Treatment During Hospitalization</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.treatment_during_hospitalization}</p>
                            </div>
                          </div>
                        )}
                        
                        {dischargeSummary.treatment_summary && (
                          <div className="field-item">
                            <label className="block text-sm font-medium text-blue-700 mb-1">Treatment Summary *</label>
                            <div className="bg-white p-3 rounded border border-gray-300">
                              <p className="text-gray-800">{dischargeSummary.treatment_summary}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discharge Medication Section */}
                  {dischargeSummary.discharge_medication && (
                    <div className="mb-6 medication-section">
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <h3 className="font-bold text-green-800 mb-4">💊 Discharge Medication</h3>
                        
                        {/* Medication table */}
                        <div className="border-2 border-gray-400 rounded-lg overflow-hidden bg-white">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-blue-50">
                                <th className="border border-gray-400 px-3 py-2 text-left font-bold text-gray-800 w-2/5">
                                  Drug Name & Dose
                                </th>
                                <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                                  Morning
                                </th>
                                <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                                  Afternoon
                                </th>
                                <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                                  Night
                                </th>
                                <th className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-1/6">
                                  Days
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parseMedications(dischargeSummary.discharge_medication).map((med, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="border border-gray-400 px-3 py-2 font-medium">{med.drug}</td>
                                  <td className="border border-gray-400 px-3 py-2 text-center font-medium">{med.morning}</td>
                                  <td className="border border-gray-400 px-3 py-2 text-center font-medium">{med.afternoon}</td>
                                  <td className="border border-gray-400 px-3 py-2 text-center font-medium">{med.night}</td>
                                  <td className="border border-gray-400 px-3 py-2 text-center font-medium">{med.days}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-2">
                          📝 Medication details as entered during discharge process
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default IPDCard;