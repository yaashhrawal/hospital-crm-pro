import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Printer, Download, X, Calendar, User, Stethoscope, Trash2 } from 'lucide-react';
import HospitalService from '../../services/hospitalService';
import DoctorService, { type DoctorInfo } from '../../services/doctorService';
import BillingService, { type OPDBill } from '../../services/billingService';
import type { PatientWithRelations, IPDSummary } from '../../config/supabaseNew';
import { supabase, HOSPITAL_ID } from '../../config/supabaseNew';
import ReceiptTemplate, { type ReceiptData } from '../receipts/ReceiptTemplate';
import { logger } from '../../utils/logger';

// Using PatientWithRelations from config instead of local interface

// Using DoctorInfo from service instead of local interface

// Using OPDBill interface from BillingService

interface OPDBillFormData {
  patientId: string;
  doctorId: string;
  consultationFee: number;
  investigationCharges: number;
  medicineCharges: number;
  otherCharges: number;
  discount: number;
  discountReason: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  services: string[];
  notes: string;
}

const IPDSummaryModule: React.FC = () => {
  const [showCreateSummary, setShowCreateSummary] = useState(false);
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRelations | null>(null);
  const [services, setServices] = useState<Array<{
    id: string;
    service: string;
    qty: number;
    amount: number;
  }>>([]);
  const [summaries, setSummaries] = useState<Array<IPDSummary & { patient: PatientWithRelations }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');

  // Load IPD summaries from database
  const loadIPDSummaries = async () => {
    try {
      setLoading(true);
      logger.log('🔍 Loading IPD summaries from database...');

      const { data: summariesData, error } = await supabase
        .from('ipd_summaries')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Error loading IPD summaries:', error);
        toast.error('Failed to load IPD summaries: ' + error.message);
        return;
      }

      logger.log('✅ Loaded IPD summaries:', summariesData?.length || 0);
      setSummaries(summariesData || []);
    } catch (error) {
      logger.error('❌ Failed to load IPD summaries:', error);
      toast.error('Failed to load IPD summaries: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Save IPD summary to database
  const saveIPDSummary = async (summaryData: {
    patient: PatientWithRelations;
    services: Array<{ id: string; service: string; qty: number; amount: number; }>;
    total: number;
    paymentMode: string;
  }) => {
    try {
      const summaryReference = `IPD-${Date.now()}`;

      const { data, error } = await supabase
        .from('ipd_summaries')
        .insert({
          patient_id: summaryData.patient.id,
          summary_reference: summaryReference,
          services: summaryData.services,
          total_amount: summaryData.total,
          payment_mode: summaryData.paymentMode,
          hospital_id: HOSPITAL_ID,
          created_by: 'system'
        })
        .select(`
          *,
          patient:patients(*)
        `)
        .single();

      if (error) {
        logger.error('❌ Error saving IPD summary:', error);
        toast.error('Failed to save IPD summary: ' + error.message);
        return null;
      }

      logger.log('✅ IPD summary saved successfully:', data);
      toast.success('IPD Summary saved successfully!');
      return data;
    } catch (error) {
      logger.error('❌ Failed to save IPD summary:', error);
      toast.error('Failed to save IPD summary: ' + (error as Error).message);
      return null;
    }
  };

  // Delete IPD summary from database
  const deleteIPDSummaryFromDB = async (summaryId: string) => {
    try {
      const { error } = await supabase
        .from('ipd_summaries')
        .delete()
        .eq('id', summaryId)
        .eq('hospital_id', HOSPITAL_ID);

      if (error) {
        logger.error('❌ Error deleting IPD summary:', error);
        toast.error('Failed to delete IPD summary: ' + error.message);
        return false;
      }

      logger.log('✅ IPD summary deleted successfully');
      toast.success('IPD Summary deleted successfully!');
      return true;
    } catch (error) {
      logger.error('❌ Failed to delete IPD summary:', error);
      toast.error('Failed to delete IPD summary: ' + (error as Error).message);
      return false;
    }
  };

  // Load all patients for selection - EXACT SAME LOGIC AS IPD BILLING
  const loadPatients = async () => {
    try {
      setLoading(true);
      logger.log('🔍 IPD SUMMARY: Loading patients with admission data...');
      logger.log('🔍 IPD SUMMARY: Hospital ID:', HOSPITAL_ID);

      // Get all patients with admissions data using direct supabase query
      // SOLUTION: Use pagination approach to bypass PostgREST's 1000 record limit
      let allPatients: any[] = [];
      let fromIndex = 0;
      const pageSize = 1000;
      let hasMoreData = true;

      while (hasMoreData) {
        logger.log(`🔍 Loading patients batch: ${fromIndex} to ${fromIndex + pageSize - 1}`);

        const { data: batch, error } = await supabase
          .from('patients')
          .select(`
            *,
            transactions:patient_transactions(*),
            admissions:patient_admissions(*)
          `)
          // .eq('hospital_id', HOSPITAL_ID) // Removed as hospital may not exist
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(fromIndex, fromIndex + pageSize - 1);

        if (error) {
          logger.error('❌ IPD SUMMARY: Error loading patients batch:', error);
          break;
        }

        if (!batch || batch.length === 0) {
          hasMoreData = false;
          break;
        }

        allPatients = [...allPatients, ...batch];

        // If we got less than pageSize records, we've reached the end
        if (batch.length < pageSize) {
          hasMoreData = false;
        } else {
          fromIndex += pageSize;
        }
      }

      logger.log('✅ IPD SUMMARY: Loaded patients with admissions:', allPatients?.length || 0);
      if (allPatients && allPatients.length > 0) {
        logger.log('✅ IPD SUMMARY: Sample patient data:', allPatients[0]);
      }
      setPatients(allPatients || []);
    } catch (error) {
      logger.error('❌ IPD SUMMARY: Failed to load patients:', error);
      toast.error('Failed to load patient data: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Add new service row
  const addService = () => {
    setServices([...services, {
      id: Date.now().toString(),
      service: '',
      qty: 1,
      amount: 0
    }]);
  };

  // Remove service row
  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  // Update service
  const updateService = (id: string, field: string, value: any) => {
    setServices(services.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Generate summary (save to database)
  const handleGenerateSummary = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (services.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    const validServices = services.filter(s => s.service && s.amount > 0);
    if (validServices.length === 0) {
      toast.error('Please add valid services with names and amounts');
      return;
    }

    const total = validServices.reduce((sum, s) => sum + s.amount, 0);

    try {
      setLoading(true);

      // Save to database
      const savedSummary = await saveIPDSummary({
        patient: selectedPatient,
        services: validServices,
        total,
        paymentMode
      });

      if (savedSummary) {
        // Reload summaries from database to get the updated list
        await loadIPDSummaries();

        // Reset form
        setSelectedPatient(null);
        setServices([]);
        setPaymentMode('CASH');
        setShowCreateSummary(false);
        setSearchTerm('');
      }
    } catch (error) {
      logger.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const commonServices = [
    'General Consultation',
    'Follow-up Consultation',
    'Blood Pressure Check',
    'Blood Sugar Test',
    'ECG',
    'X-Ray',
    'Ultrasound',
    'Laboratory Tests',
    'Vaccination',
    'Health Checkup'
  ];

  useEffect(() => {
    // Load patients and summaries immediately when component mounts
    loadPatients();
    loadIPDSummaries();
  }, []);

  useEffect(() => {
    if (showCreateSummary && patients.length === 0) {
      loadPatients();
    }
  }, [showCreateSummary, patients.length]);

  // IPD Summary Print function
  const handlePrintSummary = (summary: any) => {
    logger.log('🖨️ Printing IPD Summary:', summary);

    const selectedPatient = summary.patient;
    const services = summary.services;

    // Use the custom services data for printing
    const printServices = services.filter(s => s.service && s.amount > 0).map((service, index) => ({
      sr: index + 1,
      service: service.service,
      qty: service.qty,
      rate: service.amount / service.qty,
      amount: service.amount
    }));

    // Calculate totals from services
    const servicesTotal = services.reduce((sum, service) => sum + (parseFloat(service.amount.toString()) || 0), 0);

    // Create a temporary canvas to load and convert the image to base64
    const convertImageToBase64 = () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
        img.onerror = () => reject('Failed to load image');
        img.src = '/Receipt2.png';
      });
    };

    const createPrintWindow = (backgroundImage: string) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Unable to open print window');
        return;
      }

      // Function to convert number to words
      const convertToWords = (num: number) => {
        if (num === 0) return 'Zero Rupees Only';

        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convertHundreds = (n: number) => {
          let result = '';
          if (n >= 100) {
            result += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
          }
          if (n >= 20) {
            result += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
          } else if (n >= 10) {
            result += teens[n - 10] + ' ';
            return result;
          }
          if (n > 0) {
            result += ones[n] + ' ';
          }
          return result;
        };

        let result = '';
        const crores = Math.floor(num / 10000000);
        if (crores > 0) {
          result += convertHundreds(crores) + 'Crore ';
          num %= 10000000;
        }

        const lakhs = Math.floor(num / 100000);
        if (lakhs > 0) {
          result += convertHundreds(lakhs) + 'Lakh ';
          num %= 100000;
        }

        const thousands = Math.floor(num / 1000);
        if (thousands > 0) {
          result += convertHundreds(thousands) + 'Thousand ';
          num %= 1000;
        }

        if (num > 0) {
          result += convertHundreds(num);
        }

        return result.trim() + ' Rupees Only';
      };

      const getCurrentTime = () => {
        return new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        });
      };

      // Calculate totals from custom services
      const calculatedServicesTotal = printServices.reduce((sum, service) => sum + (parseFloat(service.amount.toString()) || 0), 0);

      const totals = {
        subtotal: calculatedServicesTotal,
        discount: 0,
        insurance: 0,
        netAmount: calculatedServicesTotal,
        amountPaid: calculatedServicesTotal,
        balance: 0
      };

      const billHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>IPD Summary - ${selectedPatient.patient_id}</title>
            <style>
              @media print {
                @page {
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  size: A3 portrait;
                  width: 297mm;
                  height: 420mm;
                }
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  width: 297mm;
                  height: 420mm;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  overflow: hidden !important;
                }
                html {
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                }
                body * {
                  visibility: hidden;
                }
                .receipt-template, .receipt-template * {
                  visibility: visible !important;
                  opacity: 1 !important;
                }
                .receipt-template {
                  position: absolute;
                  left: 0 !important;
                  top: 0 !important;
                  width: 297mm !important;
                  height: 420mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                .receipt-template img {
                  display: block !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  width: 297mm !important;
                  height: 420mm !important;
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  z-index: 0 !important;
                  object-fit: stretch !important;
                }
                .print\\:hidden {
                  display: none !important;
                }
                .receipt-template p,
                .receipt-template span,
                .receipt-template div,
                .receipt-template h1,
                .receipt-template h2,
                .receipt-template h3,
                .receipt-template h4,
                .receipt-template table,
                .receipt-template td,
                .receipt-template th {
                  color: black !important;
                  border-color: #333 !important;
                }
                .receipt-template table,
                .receipt-template th,
                .receipt-template td {
                  border: 1px solid black !important;
                }
                .receipt-template .text-right {
                  text-align: right !important;
                }
                .receipt-template p,
                .receipt-template strong {
                  color: black !important;
                }
                .receipt-template * {
                  color: black !important;
                }
                /* Force background colors and images to print */
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                /* Ensure background images are not filtered out */
                @media print {
                  body {
                    background-attachment: scroll !important;
                  }
                  .receipt-template {
                    background-attachment: scroll !important;
                  }
                }
              }

              html, body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: white;
                width: 297mm;
                height: 420mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
                overflow: hidden;
              }

              .receipt-template {
                ${backgroundImage ? `background: url('${backgroundImage}') no-repeat center top;` : ''}
                background-size: 297mm 420mm;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }
            </style>
          </head>
          <body>
            <div class="receipt-template" style="
              width: 297mm;
              height: 420mm;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              position: relative;
            ">

              <!-- Background Image - positioned absolutely -->
              ${backgroundImage ? `<img src="${backgroundImage}" style="
                position: absolute;
                top: 0;
                left: -10mm;
                width: 317mm;
                height: 420mm;
                z-index: 0;
                opacity: 1;
                object-fit: stretch;
              " />` : ''}

              <!-- Content starts after header - positioned to align with template white area -->
              <div style="margin-top: 0; padding: 300px 30px 0 30px; position: relative; z-index: 2;">

              <!-- Header Information -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 25px; font-size: 16px; color: black;">
                <div>
                  <p style="margin: 5px 0;"><strong>DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                  <p style="margin: 5px 0;"><strong>TIME:</strong> ${getCurrentTime()}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 5px 0;"><strong>PAYMENT MODE:</strong> ${summary.payment_mode || 'CASH'}</p>
                </div>
              </div>

              <!-- Patient Information Section -->
              <div style="margin-bottom: 30px;">
                <h3 style="
                  font-weight: bold;
                  margin-bottom: 15px;
                  color: black;
                  font-size: 18px;
                  text-decoration: underline;
                ">Patient & IPD Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; font-size: 16px;">
                  <div>
                    <p style="color: black; margin: 6px 0;"><strong>SUMMARY NO.:</strong> IPD-${Date.now()}</p>
                    <p style="color: black; margin: 6px 0;"><strong>SUMMARY DATE:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                    <p style="color: black; margin: 6px 0;"><strong>PATIENT ID:</strong> ${selectedPatient.patient_id || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>PATIENT NAME:</strong> ${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}</p>
                    <p style="color: black; margin: 6px 0;"><strong>AGE/SEX:</strong> ${selectedPatient.age || 'N/A'} years / ${selectedPatient.gender || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>MOBILE:</strong> ${selectedPatient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p style="color: black; margin: 6px 0;"><strong>DR NAME:</strong> ${selectedPatient.assigned_doctor || selectedPatient.doctor_name || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>IPD NO.:</strong> ${selectedPatient.ipd_number || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>ADMISSION DATE:</strong> ${selectedPatient.admission_date ? new Date(selectedPatient.admission_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>DISCHARGE DATE:</strong> ${selectedPatient.discharge_date ? new Date(selectedPatient.discharge_date).toLocaleDateString('en-IN') : 'Not Discharged'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>ROOM TYPE:</strong> ${selectedPatient.room_type || 'N/A'}</p>
                    <p style="color: black; margin: 6px 0;"><strong>BED NO.:</strong> ${selectedPatient.ipd_bed_number || selectedPatient.bed_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <!-- Services & Charges Section -->
              <div style="margin-bottom: 25px;">
                <h3 style="
                  font-weight: bold;
                  margin-bottom: 15px;
                  color: black;
                  font-size: 18px;
                  text-decoration: underline;
                ">Services & Charges</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid black;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Sr</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: left; color: black; font-weight: bold; font-size: 16px;">Service</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Qty</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Rate (₹)</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Discount</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Amount (₹)</th>
                      <th style="border: 1px solid black; padding: 12px; text-align: center; color: black; font-weight: bold; font-size: 16px;">Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${printServices.length > 0 ? printServices.map((service, index) => `
                      <tr>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${service.sr}</td>
                        <td style="border: 1px solid black; padding: 10px; color: black; font-size: 14px;">${service.service}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${service.qty}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">₹${service.rate.toFixed(2)}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">-</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">₹${service.amount.toFixed(2)}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; color: black; font-size: 14px;">${summary.payment_mode || 'CASH'}</td>
                      </tr>
                    `).join('') : `
                      <tr>
                        <td colspan="7" style="border: 1px solid black; padding: 15px; text-align: center; color: black; font-size: 14px; font-style: italic;">No service details available</td>
                      </tr>
                    `}
                    <!-- Net Amount Paid Row -->
                    <tr style="background-color: #f0f0f0;">
                      <td colspan="7" style="border: 1px solid black; padding: 15px; text-align: center; color: black; font-weight: bold; font-size: 18px;">
                        Net Amount: ₹${totals.netAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Amount in Words -->
              <div style="text-align: center; margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border: 1px solid #ddd;">
                <p style="font-size: 16px; color: black; margin: 0;"><strong>Amount in Words:</strong> ${convertToWords(totals.netAmount)}</p>
              </div>

              <!-- Signature Section -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; margin-bottom: 30px;">
                <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                  <p style="font-size: 14px; color: black; margin: 0;">Patient/Guardian Signature</p>
                </div>
                <div style="text-align: center; border-top: 2px solid black; padding-top: 8px;">
                  <p style="font-size: 14px; color: black; margin: 0;">Authorized Signature</p>
                  <p style="font-size: 12px; color: black; margin: 4px 0 0 0;">Hospital Administrator</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; margin-top: 25px;">
                <p style="font-size: 14px; color: black; margin: 4px 0;">Thank you for choosing VALANT HOSPITAL</p>
                <p style="font-size: 12px; color: black; margin: 4px 0;">A unit of Navratna Medicare Pvt Ltd</p>
                <p style="font-size: 14px; color: black; margin: 8px 0 0 0; font-weight: bold;">** IPD SUMMARY **</p>
              </div>

              </div>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(billHTML);
      printWindow.document.close();
    };

    // Convert image and create print window
    convertImageToBase64().then((base64Image) => {
      createPrintWindow(base64Image as string);
    }).catch((error) => {
      logger.error('Failed to load Receipt2.png:', error);
      // Create print window without background image
      createPrintWindow('');
    });
  };

  // Delete IPD Summary function
  const handleDeleteSummary = async (summaryId: string) => {
    const summaryToDelete = summaries.find(s => s.id === summaryId);
    if (!summaryToDelete) {
      toast.error('Summary not found');
      return;
    }

    const patientName = `${summaryToDelete.patient.first_name} ${summaryToDelete.patient.last_name}`.trim();

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this IPD summary?\n\nSummary ID: ${summaryToDelete.summary_reference}\nPatient: ${patientName}\nAmount: ₹${summaryToDelete.total_amount.toLocaleString()}\nPayment Mode: ${summaryToDelete.payment_mode}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setLoading(true);

      // Delete from database
      const deleteSuccess = await deleteIPDSummaryFromDB(summaryId);

      if (deleteSuccess) {
        // Reload summaries from database to get the updated list
        await loadIPDSummaries();
      }
    } catch (error) {
      logger.error('Failed to delete summary:', error);
      toast.error('Failed to delete summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">IPD Summary</h2>
          <p className="text-gray-600">Create and print custom IPD summaries</p>
        </div>
        <button
          onClick={() => setShowCreateSummary(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create IPD Summary
        </button>
      </div>

      {/* Create Summary Modal */}
      {showCreateSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Create IPD Summary</h3>
              <button
                onClick={() => {
                  setShowCreateSummary(false);
                  setSelectedPatient(null);
                  setServices([]);
                  setPaymentMode('CASH');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Loading all patients...</p>
                  </div>
                ) : (
                  <>
                    <div className="mt-2 mb-2 text-sm text-gray-600">
                      Showing {patients
                        .filter(p =>
                          !searchTerm ||
                          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patient_id?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length} of {patients.length} patients
                    </div>
                    <div className="max-h-96 overflow-y-auto border rounded-md">
                      {patients
                        .filter(p =>
                          !searchTerm ||
                          `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.patient_id?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(patient => (
                          <div
                            key={patient.id}
                            onClick={() => setSelectedPatient(patient)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b ${
                              selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                            <div className="text-sm text-gray-500">ID: {patient.patient_id} | Age: {patient.age} | {patient.gender}</div>
                          </div>
                        ))}
                      {patients.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          No patients found in the database
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Selected Patient Info */}
              {selectedPatient && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900">Selected Patient</h4>
                  <p className="text-blue-800">{selectedPatient.first_name} {selectedPatient.last_name} (ID: {selectedPatient.patient_id})</p>
                </div>
              )}

              {/* Services Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Services
                  </label>
                  <button
                    onClick={addService}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Service
                  </button>
                </div>

                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={service.id} className="flex space-x-3 items-center">
                      <input
                        type="text"
                        placeholder="Service name"
                        value={service.service}
                        onChange={(e) => updateService(service.id, 'service', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={service.qty}
                        onChange={(e) => updateService(service.id, 'qty', parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={service.amount}
                        onChange={(e) => updateService(service.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                      <button
                        onClick={() => removeService(service.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {services.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No services added yet. Click "Add Service" to get started.</p>
                )}
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="SUMMARY">Summary</option>
                </select>
              </div>

              {/* Total */}
              {services.length > 0 && (
                <div className="border-t pt-4">
                  <div className="text-right">
                    <span className="text-lg font-semibold">
                      Total: ₹{services.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowCreateSummary(false);
                  setSelectedPatient(null);
                  setServices([]);
                  setPaymentMode('CASH');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSummary}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!selectedPatient || services.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Summaries List */}
      {summaries.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Generated IPD Summaries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">📋</span>
                        {summary.summary_reference}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{summary.patient.first_name} {summary.patient.last_name}</div>
                        <div className="text-gray-500 text-xs">ID: {summary.patient.patient_id}</div>
                        <div className="text-gray-500 text-xs">Age: {summary.patient.age} | {summary.patient.gender}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {summary.services.length} services
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {summary.payment_mode || 'CASH'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{summary.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(summary.created_at).toLocaleDateString('en-IN')}
                      <div className="text-xs text-gray-500">
                        {new Date(summary.created_at).toLocaleTimeString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePrintSummary(summary)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Print Summary"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSummary(summary.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Delete Summary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPDSummaryModule;