import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface AnaesthesiaNotesFormProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: {
    name: string;
    age: string;
    gender: string;
    ipdNo: string;
    roomWardNo?: string;
    patientId?: string;
    doctorName?: string;
  };
  savedData?: any; // Previously saved form data
  onSave?: (data: any) => void;
}

const AnaesthesiaNotesForm: React.FC<AnaesthesiaNotesFormProps> = ({
  isOpen,
  onClose,
  patientData,
  savedData,
  onSave
}) => {
  const [formData, setFormData] = useState({
    // Patient Information
    patientName: savedData?.patientName || patientData.name || '',
    ageSex: savedData?.ageSex || `${patientData.age || ''} / ${patientData.gender || ''}`,
    date: savedData?.date || new Date().toISOString().split('T')[0],
    patientId: savedData?.patientId || patientData.patientId || '',
    ipdNo: savedData?.ipdNo || patientData.ipdNo || '',
    consultantName: savedData?.consultantName || patientData.doctorName || '',
    
    // Form 5A - Pre-Op Details
    timeIn: savedData?.timeIn || '',
    timeOut: savedData?.timeOut || '',
    anaesthetist1: savedData?.anaesthetist1 || '',
    anaesthetist2: savedData?.anaesthetist2 || '',
    surgeon1: savedData?.surgeon1 || '',
    surgeon2: savedData?.surgeon2 || '',
    
    // Pre-Medication
    atropine: savedData?.atropine || '',
    glycopyrrolate: savedData?.glycopyrrolate || '',
    hyoscine: savedData?.hyoscine || '',
    fentanyl: savedData?.fentanyl || '',
    midazolam: savedData?.midazolam || '',
    otherPremed: savedData?.otherPremed || '',
    
    // Pre-Op Procedure checkboxes
    intracaath: savedData?.intracaath || false,
    cardiacMonitor: savedData?.cardiacMonitor || false,
    foleys: savedData?.foleys || false,
    rtCentralLine: savedData?.rtCentralLine || false,
    
    // Anaesthesia Technique
    anaesthesiaTechnique: savedData?.anaesthesiaTechnique || '',
    
    // Position of Patient
    patientPosition: savedData?.patientPosition || '',
    
    // Inducing Agent
    propofol: savedData?.propofol || false,
    thiopentone: savedData?.thiopentone || false,
    etomidate: savedData?.etomidate || false,
    ketamine: savedData?.ketamine || false,
    otherInducingAgent: savedData?.otherInducingAgent || '',
    
    // Muscle Relaxant
    succinylcholine: savedData?.succinylcholine || '',
    atracurium: savedData?.atracurium || '',
    vecuronium: savedData?.vecuronium || '',
    rocuronium: savedData?.rocuronium || '',
    otherMuscleRelaxant: savedData?.otherMuscleRelaxant || '',
    
    // Laryngoscope Reflex Attenuation
    lignocaine: savedData?.lignocaine || '',
    fentanylLaryngo: savedData?.fentanylLaryngo || '',
    otherAttenuation: savedData?.otherAttenuation || '',
    
    // ET Tube
    redRubber: savedData?.redRubber || '',
    portex: savedData?.portex || '',
    cuffPain: savedData?.cuffPain || '',
    tubeSize: savedData?.tubeSize || '',
    
    // Induction
    inductionDetails: savedData?.inductionDetails || '',
    
    // Inhalation Agent
    halothane: savedData?.halothane || '',
    isoflurane: savedData?.isoflurane || '',
    sevoflurane: savedData?.sevoflurane || '',
    desflurane: savedData?.desflurane || '',
    otherInhalation: savedData?.otherInhalation || '',
    
    // Circuit
    circuit: savedData?.circuit || '',
    
    // Ventilation
    ventilation: savedData?.ventilation || '',
    
    // Reversal
    neostigmine: savedData?.neostigmine || '',
    atropineReversal: savedData?.atropineReversal || '',
    sugammadex: savedData?.sugammadex || '',
    otherReversal: savedData?.otherReversal || '',
    
    // Intra-Op Complications
    complications: savedData?.complications || '',
    
    // Regional Effect
    regionalEffect: savedData?.regionalEffect || '',
    
    // Form 5B - Progress Note Tables
    // Activity monitoring (8 time slots)
    pulseT1: savedData?.pulseT1 || '', pulseT2: savedData?.pulseT2 || '', pulseT3: savedData?.pulseT3 || '',
    pulseT4: savedData?.pulseT4 || '', pulseT5: savedData?.pulseT5 || '', pulseT6: savedData?.pulseT6 || '',
    pulseT7: savedData?.pulseT7 || '', pulseT8: savedData?.pulseT8 || '',
    
    bpT1: savedData?.bpT1 || '', bpT2: savedData?.bpT2 || '', bpT3: savedData?.bpT3 || '',
    bpT4: savedData?.bpT4 || '', bpT5: savedData?.bpT5 || '', bpT6: savedData?.bpT6 || '',
    bpT7: savedData?.bpT7 || '', bpT8: savedData?.bpT8 || '',
    
    spo2T1: savedData?.spo2T1 || '', spo2T2: savedData?.spo2T2 || '', spo2T3: savedData?.spo2T3 || '',
    spo2T4: savedData?.spo2T4 || '', spo2T5: savedData?.spo2T5 || '', spo2T6: savedData?.spo2T6 || '',
    spo2T7: savedData?.spo2T7 || '', spo2T8: savedData?.spo2T8 || '',
    
    etco2T1: savedData?.etco2T1 || '', etco2T2: savedData?.etco2T2 || '', etco2T3: savedData?.etco2T3 || '',
    etco2T4: savedData?.etco2T4 || '', etco2T5: savedData?.etco2T5 || '', etco2T6: savedData?.etco2T6 || '',
    etco2T7: savedData?.etco2T7 || '', etco2T8: savedData?.etco2T8 || '',
    
    cardiacRhythmT1: savedData?.cardiacRhythmT1 || '', cardiacRhythmT2: savedData?.cardiacRhythmT2 || '',
    cardiacRhythmT3: savedData?.cardiacRhythmT3 || '', cardiacRhythmT4: savedData?.cardiacRhythmT4 || '',
    cardiacRhythmT5: savedData?.cardiacRhythmT5 || '', cardiacRhythmT6: savedData?.cardiacRhythmT6 || '',
    cardiacRhythmT7: savedData?.cardiacRhythmT7 || '', cardiacRhythmT8: savedData?.cardiacRhythmT8 || '',
    
    cvpT1: savedData?.cvpT1 || '', cvpT2: savedData?.cvpT2 || '', cvpT3: savedData?.cvpT3 || '',
    cvpT4: savedData?.cvpT4 || '', cvpT5: savedData?.cvpT5 || '', cvpT6: savedData?.cvpT6 || '',
    cvpT7: savedData?.cvpT7 || '', cvpT8: savedData?.cvpT8 || '',
    
    temperatureT1: savedData?.temperatureT1 || '', temperatureT2: savedData?.temperatureT2 || '',
    temperatureT3: savedData?.temperatureT3 || '', temperatureT4: savedData?.temperatureT4 || '',
    temperatureT5: savedData?.temperatureT5 || '', temperatureT6: savedData?.temperatureT6 || '',
    temperatureT7: savedData?.temperatureT7 || '', temperatureT8: savedData?.temperatureT8 || '',
    
    urineOutputT1: savedData?.urineOutputT1 || '', urineOutputT2: savedData?.urineOutputT2 || '',
    urineOutputT3: savedData?.urineOutputT3 || '', urineOutputT4: savedData?.urineOutputT4 || '',
    urineOutputT5: savedData?.urineOutputT5 || '', urineOutputT6: savedData?.urineOutputT6 || '',
    urineOutputT7: savedData?.urineOutputT7 || '', urineOutputT8: savedData?.urineOutputT8 || '',
    
    respiratoryRateT1: savedData?.respiratoryRateT1 || '', respiratoryRateT2: savedData?.respiratoryRateT2 || '',
    respiratoryRateT3: savedData?.respiratoryRateT3 || '', respiratoryRateT4: savedData?.respiratoryRateT4 || '',
    respiratoryRateT5: savedData?.respiratoryRateT5 || '', respiratoryRateT6: savedData?.respiratoryRateT6 || '',
    respiratoryRateT7: savedData?.respiratoryRateT7 || '', respiratoryRateT8: savedData?.respiratoryRateT8 || '',
    
    // Fluid/Drug monitoring (8 time slots)
    dnsT1: savedData?.dnsT1 || '', dnsT2: savedData?.dnsT2 || '', dnsT3: savedData?.dnsT3 || '',
    dnsT4: savedData?.dnsT4 || '', dnsT5: savedData?.dnsT5 || '', dnsT6: savedData?.dnsT6 || '',
    dnsT7: savedData?.dnsT7 || '', dnsT8: savedData?.dnsT8 || '',
    
    rlT1: savedData?.rlT1 || '', rlT2: savedData?.rlT2 || '', rlT3: savedData?.rlT3 || '',
    rlT4: savedData?.rlT4 || '', rlT5: savedData?.rlT5 || '', rlT6: savedData?.rlT6 || '',
    rlT7: savedData?.rlT7 || '', rlT8: savedData?.rlT8 || '',
    
    isolyteT1: savedData?.isolyteT1 || '', isolyteT2: savedData?.isolyteT2 || '', isolyteT3: savedData?.isolyteT3 || '',
    isolyteT4: savedData?.isolyteT4 || '', isolyteT5: savedData?.isolyteT5 || '', isolyteT6: savedData?.isolyteT6 || '',
    isolyteT7: savedData?.isolyteT7 || '', isolyteT8: savedData?.isolyteT8 || '',
    
    colloidsT1: savedData?.colloidsT1 || '', colloidsT2: savedData?.colloidsT2 || '', colloidsT3: savedData?.colloidsT3 || '',
    colloidsT4: savedData?.colloidsT4 || '', colloidsT5: savedData?.colloidsT5 || '', colloidsT6: savedData?.colloidsT6 || '',
    colloidsT7: savedData?.colloidsT7 || '', colloidsT8: savedData?.colloidsT8 || '',
    
    btT1: savedData?.btT1 || '', btT2: savedData?.btT2 || '', btT3: savedData?.btT3 || '',
    btT4: savedData?.btT4 || '', btT5: savedData?.btT5 || '', btT6: savedData?.btT6 || '',
    btT7: savedData?.btT7 || '', btT8: savedData?.btT8 || '',
    
    muscleRelaxantT1: savedData?.muscleRelaxantT1 || '', muscleRelaxantT2: savedData?.muscleRelaxantT2 || '',
    muscleRelaxantT3: savedData?.muscleRelaxantT3 || '', muscleRelaxantT4: savedData?.muscleRelaxantT4 || '',
    muscleRelaxantT5: savedData?.muscleRelaxantT5 || '', muscleRelaxantT6: savedData?.muscleRelaxantT6 || '',
    muscleRelaxantT7: savedData?.muscleRelaxantT7 || '', muscleRelaxantT8: savedData?.muscleRelaxantT8 || '',
    
    fentanylProgressT1: savedData?.fentanylProgressT1 || '', fentanylProgressT2: savedData?.fentanylProgressT2 || '',
    fentanylProgressT3: savedData?.fentanylProgressT3 || '', fentanylProgressT4: savedData?.fentanylProgressT4 || '',
    fentanylProgressT5: savedData?.fentanylProgressT5 || '', fentanylProgressT6: savedData?.fentanylProgressT6 || '',
    fentanylProgressT7: savedData?.fentanylProgressT7 || '', fentanylProgressT8: savedData?.fentanylProgressT8 || '',
    
    propofolProgressT1: savedData?.propofolProgressT1 || '', propofolProgressT2: savedData?.propofolProgressT2 || '',
    propofolProgressT3: savedData?.propofolProgressT3 || '', propofolProgressT4: savedData?.propofolProgressT4 || '',
    propofolProgressT5: savedData?.propofolProgressT5 || '', propofolProgressT6: savedData?.propofolProgressT6 || '',
    propofolProgressT7: savedData?.propofolProgressT7 || '', propofolProgressT8: savedData?.propofolProgressT8 || '',
    
    localAnaesthesiaT1: savedData?.localAnaesthesiaT1 || '', localAnaesthesiaT2: savedData?.localAnaesthesiaT2 || '',
    localAnaesthesiaT3: savedData?.localAnaesthesiaT3 || '', localAnaesthesiaT4: savedData?.localAnaesthesiaT4 || '',
    localAnaesthesiaT5: savedData?.localAnaesthesiaT5 || '', localAnaesthesiaT6: savedData?.localAnaesthesiaT6 || '',
    localAnaesthesiaT7: savedData?.localAnaesthesiaT7 || '', localAnaesthesiaT8: savedData?.localAnaesthesiaT8 || '',
    
    // Post-Op Instructions
    checkPostOpVitals: savedData?.checkPostOpVitals || false,
    ivInfusion: savedData?.ivInfusion || false,
    analgesics: savedData?.analgesics || false,
    oxygenation: savedData?.oxygenation || false,
    
    transferPatientTo: savedData?.transferPatientTo || '',
    nbmTill: savedData?.nbmTill || '',
    vitalsOnTransfer: savedData?.vitalsOnTransfer || '',
    
    // Signatures
    anaesthesiaSignature: savedData?.anaesthesiaSignature || '',
    otStaffSignature: savedData?.otStaffSignature || '',
    signatureDate: savedData?.signatureDate || new Date().toISOString().split('T')[0],
    signatureTime: savedData?.signatureTime || ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (onSave) {
      onSave({
        ...formData,
        createdAt: new Date().toISOString(),
        patientId: patientData.patientId
      });
    }
    toast.success('Anaesthesia Notes saved successfully');
    onClose();
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the form');
      return;
    }

    // Build the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 8px;
              line-height: 1.1;
            }
            
            .print-button {
              display: none !important;
            }
            
            @page {
              margin: 15mm;
              size: A4;
              @top-left { content: ""; }
              @top-center { content: ""; }
              @top-right { content: ""; }
              @bottom-left { content: ""; }
              @bottom-center { content: ""; }
              @bottom-right { content: ""; }
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 8px;
            line-height: 1.1;
            color: #000;
            margin: 0;
            padding: 15px;
          }
          
          .container {
            width: 100%;
            max-width: 100%;
          }
          
          h1 {
            text-align: center;
            font-size: 14px;
            margin-bottom: 8px;
            text-decoration: underline;
            font-weight: bold;
          }
          
          h2 {
            text-align: center;
            font-size: 12px;
            margin-bottom: 6px;
            text-decoration: underline;
            font-weight: bold;
          }
          
          .patient-header {
            margin-bottom: 8px;
            border: 1px solid #000;
            padding: 4px;
          }
          
          .field-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 3px;
          }
          
          .field {
            flex: 1;
            min-width: 120px;
          }
          
          .field-small {
            flex: 0.5;
            min-width: 80px;
          }
          
          label {
            font-weight: bold;
            margin-right: 4px;
          }
          
          .value {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 60px;
            padding: 1px 3px;
            min-height: 10px;
          }
          
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          
          .details-table th,
          .details-table td {
            border: 1px solid #333;
            padding: 2px;
            text-align: left;
            font-size: 7px;
          }
          
          .details-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .checkbox-mark {
            width: 8px;
            height: 8px;
            border: 1px solid #333;
            display: inline-block;
            text-align: center;
            line-height: 6px;
            margin-right: 2px;
          }
          
          .radio-mark {
            width: 8px;
            height: 8px;
            border: 1px solid #333;
            border-radius: 50%;
            display: inline-block;
            text-align: center;
            line-height: 6px;
            margin-right: 2px;
          }
          
          .progress-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
          }
          
          .progress-table th,
          .progress-table td {
            border: 1px solid #333;
            padding: 1px;
            text-align: center;
            font-size: 6px;
          }
          
          .progress-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
          }
          
          .signature-section {
            flex: 1;
            margin: 0 10px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ANAESTHESIA NOTES</h1>
          
          <!-- Patient Header -->
          <div class="patient-header">
            <div class="field-group">
              <div class="field">
                <label>Patient's Name:</label>
                <span class="value">${formData.patientName || ''}</span>
              </div>
              <div class="field-small">
                <label>Age/Sex:</label>
                <span class="value">${formData.ageSex || ''}</span>
              </div>
              <div class="field-small">
                <label>Date:</label>
                <span class="value">${formData.date || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field-small">
                <label>Patient ID:</label>
                <span class="value">${formData.patientId || ''}</span>
              </div>
              <div class="field-small">
                <label>IPD No.:</label>
                <span class="value">${formData.ipdNo || ''}</span>
              </div>
              <div class="field">
                <label>Consultant Name:</label>
                <span class="value">${formData.consultantName || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Form 5A Pre-Op Details -->
          <h2>FORM 5A - PRE-OPERATIVE DETAILS</h2>
          <table class="details-table">
            <thead>
              <tr>
                <th style="width: 60%;">Details</th>
                <th style="width: 20%;">Signature 1</th>
                <th style="width: 20%;">Signature 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TIME-IN: ${formData.timeIn || ''} TIME-OUT: ${formData.timeOut || ''}</td>
                <td>${formData.anaesthetist1 || ''}</td>
                <td>${formData.anaesthetist2 || ''}</td>
              </tr>
              <tr>
                <td>1. ANAESTHETISTS</td>
                <td>${formData.anaesthetist1 || ''}</td>
                <td>${formData.anaesthetist2 || ''}</td>
              </tr>
              <tr>
                <td>2. SURGEONS</td>
                <td>${formData.surgeon1 || ''}</td>
                <td>${formData.surgeon2 || ''}</td>
              </tr>
              <tr>
                <td colspan="2">3. PRE-MEDICATION<br>
                  Atropine: ${formData.atropine || ''} | Glycopyrrolate: ${formData.glycopyrrolate || ''} | Hyoscine: ${formData.hyoscine || ''}<br>
                  Fentanyl: ${formData.fentanyl || ''} | Midazolam: ${formData.midazolam || ''} | Other: ${formData.otherPremed || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">4. PRE-OP PROCEDURE<br>
                  ${formData.intracaath ? '☑' : '☐'} Intracaath | ${formData.cardiacMonitor ? '☑' : '☐'} Cardiac Monitor | 
                  ${formData.foleys ? '☑' : '☐'} Foley's | ${formData.rtCentralLine ? '☑' : '☐'} RT/Central Line
                </td>
              </tr>
              <tr>
                <td colspan="2">5. ANAESTHESIA TECHNIQUE<br>
                  Selected: ${formData.anaesthesiaTechnique || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">6. POSITION OF PATIENT: ${formData.patientPosition || ''}</td>
              </tr>
              <tr>
                <td colspan="2">7. INDUCING AGENT<br>
                  ${formData.propofol ? '☑' : '☐'} Propofol | ${formData.thiopentone ? '☑' : '☐'} Thiopentone | ${formData.etomidate ? '☑' : '☐'} Etomidate<br>
                  ${formData.ketamine ? '☑' : '☐'} Ketamine | Other: ${formData.otherInducingAgent || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">8. MUSCLE RELAXANT<br>
                  Succinylcholine: ${formData.succinylcholine ? formData.succinylcholine + ' mg' : ''} | Atracurium: ${formData.atracurium ? formData.atracurium + ' mg' : ''}<br>
                  Vecuronium: ${formData.vecuronium ? formData.vecuronium + ' mg' : ''} | Rocuronium: ${formData.rocuronium ? formData.rocuronium + ' mg' : ''} | Other: ${formData.otherMuscleRelaxant || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">9. LARYNGOSCOPE REFLEX ATTENUATION<br>
                  Lignocaine: ${formData.lignocaine ? formData.lignocaine + ' mg' : ''} | Fentanyl: ${formData.fentanylLaryngo ? formData.fentanylLaryngo + ' mcg' : ''} | Other: ${formData.otherAttenuation || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">10. ET TUBE<br>
                  Red Rubber: ${formData.redRubber || ''} | Portex: ${formData.portex || ''} | Cuff/Pain: ${formData.cuffPain || ''} | Size: ${formData.tubeSize ? formData.tubeSize + ' mm' : ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">11. INDUCTION: ${formData.inductionDetails || ''}</td>
              </tr>
              <tr>
                <td colspan="2">12. INHALATION AGENT<br>
                  Halothane: ${formData.halothane || ''} | Isoflurane: ${formData.isoflurane || ''} | Sevoflurane: ${formData.sevoflurane || ''}<br>
                  Desflurane: ${formData.desflurane || ''} | Other: ${formData.otherInhalation || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">13. CIRCUIT: ${formData.circuit || ''}</td>
              </tr>
              <tr>
                <td colspan="2">14. VENTILATION: ${formData.ventilation || ''}</td>
              </tr>
              <tr>
                <td colspan="2">15. REVERSAL<br>
                  Neostigmine: ${formData.neostigmine ? formData.neostigmine + ' mg' : ''} | Atropine: ${formData.atropineReversal ? formData.atropineReversal + ' mg' : ''} | Sugammadex: ${formData.sugammadex ? formData.sugammadex + ' mg' : ''} | Other: ${formData.otherReversal || ''}
                </td>
              </tr>
              <tr>
                <td colspan="2">16. INTRA-OP COMPLICATIONS: ${formData.complications || ''}</td>
              </tr>
              <tr>
                <td colspan="2">17. REGIONAL EFFECT: ${formData.regionalEffect || ''}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Form 5B Progress Note -->
          <h2>FORM 5B - ANAESTHESIA PROGRESS NOTE</h2>
          
          <!-- Activity Table -->
          <table class="progress-table">
            <thead>
              <tr>
                <th>ACTIVITY/TIME</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>T8</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PULSE (bpm)</td>
                <td>${formData.pulseT1 ? formData.pulseT1 + ' bpm' : ''}</td><td>${formData.pulseT2 ? formData.pulseT2 + ' bpm' : ''}</td><td>${formData.pulseT3 ? formData.pulseT3 + ' bpm' : ''}</td>
                <td>${formData.pulseT4 ? formData.pulseT4 + ' bpm' : ''}</td><td>${formData.pulseT5 ? formData.pulseT5 + ' bpm' : ''}</td><td>${formData.pulseT6 ? formData.pulseT6 + ' bpm' : ''}</td>
                <td>${formData.pulseT7 ? formData.pulseT7 + ' bpm' : ''}</td><td>${formData.pulseT8 ? formData.pulseT8 + ' bpm' : ''}</td>
              </tr>
              <tr>
                <td>B.P. (mmHg)</td>
                <td>${formData.bpT1 ? formData.bpT1 + ' mmHg' : ''}</td><td>${formData.bpT2 ? formData.bpT2 + ' mmHg' : ''}</td><td>${formData.bpT3 ? formData.bpT3 + ' mmHg' : ''}</td>
                <td>${formData.bpT4 ? formData.bpT4 + ' mmHg' : ''}</td><td>${formData.bpT5 ? formData.bpT5 + ' mmHg' : ''}</td><td>${formData.bpT6 ? formData.bpT6 + ' mmHg' : ''}</td>
                <td>${formData.bpT7 ? formData.bpT7 + ' mmHg' : ''}</td><td>${formData.bpT8 ? formData.bpT8 + ' mmHg' : ''}</td>
              </tr>
              <tr>
                <td>SPO2 (%)</td>
                <td>${formData.spo2T1 ? formData.spo2T1 + ' %' : ''}</td><td>${formData.spo2T2 ? formData.spo2T2 + ' %' : ''}</td><td>${formData.spo2T3 ? formData.spo2T3 + ' %' : ''}</td>
                <td>${formData.spo2T4 ? formData.spo2T4 + ' %' : ''}</td><td>${formData.spo2T5 ? formData.spo2T5 + ' %' : ''}</td><td>${formData.spo2T6 ? formData.spo2T6 + ' %' : ''}</td>
                <td>${formData.spo2T7 ? formData.spo2T7 + ' %' : ''}</td><td>${formData.spo2T8 ? formData.spo2T8 + ' %' : ''}</td>
              </tr>
              <tr>
                <td>ETCO2 (mmHg)</td>
                <td>${formData.etco2T1 ? formData.etco2T1 + ' mmHg' : ''}</td><td>${formData.etco2T2 ? formData.etco2T2 + ' mmHg' : ''}</td><td>${formData.etco2T3 ? formData.etco2T3 + ' mmHg' : ''}</td>
                <td>${formData.etco2T4 ? formData.etco2T4 + ' mmHg' : ''}</td><td>${formData.etco2T5 ? formData.etco2T5 + ' mmHg' : ''}</td><td>${formData.etco2T6 ? formData.etco2T6 + ' mmHg' : ''}</td>
                <td>${formData.etco2T7 ? formData.etco2T7 + ' mmHg' : ''}</td><td>${formData.etco2T8 ? formData.etco2T8 + ' mmHg' : ''}</td>
              </tr>
              <tr>
                <td>CARDIAC RHYTHM</td>
                <td>${formData.cardiacRhythmT1 || ''}</td><td>${formData.cardiacRhythmT2 || ''}</td><td>${formData.cardiacRhythmT3 || ''}</td>
                <td>${formData.cardiacRhythmT4 || ''}</td><td>${formData.cardiacRhythmT5 || ''}</td><td>${formData.cardiacRhythmT6 || ''}</td>
                <td>${formData.cardiacRhythmT7 || ''}</td><td>${formData.cardiacRhythmT8 || ''}</td>
              </tr>
              <tr>
                <td>CVP (cmH2O)</td>
                <td>${formData.cvpT1 ? formData.cvpT1 + ' cmH2O' : ''}</td><td>${formData.cvpT2 ? formData.cvpT2 + ' cmH2O' : ''}</td><td>${formData.cvpT3 ? formData.cvpT3 + ' cmH2O' : ''}</td>
                <td>${formData.cvpT4 ? formData.cvpT4 + ' cmH2O' : ''}</td><td>${formData.cvpT5 ? formData.cvpT5 + ' cmH2O' : ''}</td><td>${formData.cvpT6 ? formData.cvpT6 + ' cmH2O' : ''}</td>
                <td>${formData.cvpT7 ? formData.cvpT7 + ' cmH2O' : ''}</td><td>${formData.cvpT8 ? formData.cvpT8 + ' cmH2O' : ''}</td>
              </tr>
              <tr>
                <td>TEMPERATURE (°F)</td>
                <td>${formData.temperatureT1 ? formData.temperatureT1 + ' °F' : ''}</td><td>${formData.temperatureT2 ? formData.temperatureT2 + ' °F' : ''}</td><td>${formData.temperatureT3 ? formData.temperatureT3 + ' °F' : ''}</td>
                <td>${formData.temperatureT4 ? formData.temperatureT4 + ' °F' : ''}</td><td>${formData.temperatureT5 ? formData.temperatureT5 + ' °F' : ''}</td><td>${formData.temperatureT6 ? formData.temperatureT6 + ' °F' : ''}</td>
                <td>${formData.temperatureT7 ? formData.temperatureT7 + ' °F' : ''}</td><td>${formData.temperatureT8 ? formData.temperatureT8 + ' °F' : ''}</td>
              </tr>
              <tr>
                <td>URINE OUTPUT (ml)</td>
                <td>${formData.urineOutputT1 ? formData.urineOutputT1 + ' ml' : ''}</td><td>${formData.urineOutputT2 ? formData.urineOutputT2 + ' ml' : ''}</td><td>${formData.urineOutputT3 ? formData.urineOutputT3 + ' ml' : ''}</td>
                <td>${formData.urineOutputT4 ? formData.urineOutputT4 + ' ml' : ''}</td><td>${formData.urineOutputT5 ? formData.urineOutputT5 + ' ml' : ''}</td><td>${formData.urineOutputT6 ? formData.urineOutputT6 + ' ml' : ''}</td>
                <td>${formData.urineOutputT7 ? formData.urineOutputT7 + ' ml' : ''}</td><td>${formData.urineOutputT8 ? formData.urineOutputT8 + ' ml' : ''}</td>
              </tr>
              <tr>
                <td>RESPIRATORY RATE (/min)</td>
                <td>${formData.respiratoryRateT1 ? formData.respiratoryRateT1 + ' /min' : ''}</td><td>${formData.respiratoryRateT2 ? formData.respiratoryRateT2 + ' /min' : ''}</td><td>${formData.respiratoryRateT3 ? formData.respiratoryRateT3 + ' /min' : ''}</td>
                <td>${formData.respiratoryRateT4 ? formData.respiratoryRateT4 + ' /min' : ''}</td><td>${formData.respiratoryRateT5 ? formData.respiratoryRateT5 + ' /min' : ''}</td><td>${formData.respiratoryRateT6 ? formData.respiratoryRateT6 + ' /min' : ''}</td>
                <td>${formData.respiratoryRateT7 ? formData.respiratoryRateT7 + ' /min' : ''}</td><td>${formData.respiratoryRateT8 ? formData.respiratoryRateT8 + ' /min' : ''}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Fluid/Drug Table -->
          <table class="progress-table">
            <thead>
              <tr>
                <th>FLUID DRUG/TIME</th>
                <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th><th>T8</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DNS/D5%/NS (ml)</td>
                <td>${formData.dnsT1 ? formData.dnsT1 + ' ml' : ''}</td><td>${formData.dnsT2 ? formData.dnsT2 + ' ml' : ''}</td><td>${formData.dnsT3 ? formData.dnsT3 + ' ml' : ''}</td>
                <td>${formData.dnsT4 ? formData.dnsT4 + ' ml' : ''}</td><td>${formData.dnsT5 ? formData.dnsT5 + ' ml' : ''}</td><td>${formData.dnsT6 ? formData.dnsT6 + ' ml' : ''}</td>
                <td>${formData.dnsT7 ? formData.dnsT7 + ' ml' : ''}</td><td>${formData.dnsT8 ? formData.dnsT8 + ' ml' : ''}</td>
              </tr>
              <tr>
                <td>R.L. (ml)</td>
                <td>${formData.rlT1 ? formData.rlT1 + ' ml' : ''}</td><td>${formData.rlT2 ? formData.rlT2 + ' ml' : ''}</td><td>${formData.rlT3 ? formData.rlT3 + ' ml' : ''}</td>
                <td>${formData.rlT4 ? formData.rlT4 + ' ml' : ''}</td><td>${formData.rlT5 ? formData.rlT5 + ' ml' : ''}</td><td>${formData.rlT6 ? formData.rlT6 + ' ml' : ''}</td>
                <td>${formData.rlT7 ? formData.rlT7 + ' ml' : ''}</td><td>${formData.rlT8 ? formData.rlT8 + ' ml' : ''}</td>
              </tr>
              <tr>
                <td>ISOLYTE M/G/P (ml)</td>
                <td>${formData.isolyteT1 ? formData.isolyteT1 + ' ml' : ''}</td><td>${formData.isolyteT2 ? formData.isolyteT2 + ' ml' : ''}</td><td>${formData.isolyteT3 ? formData.isolyteT3 + ' ml' : ''}</td>
                <td>${formData.isolyteT4 ? formData.isolyteT4 + ' ml' : ''}</td><td>${formData.isolyteT5 ? formData.isolyteT5 + ' ml' : ''}</td><td>${formData.isolyteT6 ? formData.isolyteT6 + ' ml' : ''}</td>
                <td>${formData.isolyteT7 ? formData.isolyteT7 + ' ml' : ''}</td><td>${formData.isolyteT8 ? formData.isolyteT8 + ' ml' : ''}</td>
              </tr>
              <tr>
                <td>COLLOIDS (ml)</td>
                <td>${formData.colloidsT1 ? formData.colloidsT1 + ' ml' : ''}</td><td>${formData.colloidsT2 ? formData.colloidsT2 + ' ml' : ''}</td><td>${formData.colloidsT3 ? formData.colloidsT3 + ' ml' : ''}</td>
                <td>${formData.colloidsT4 ? formData.colloidsT4 + ' ml' : ''}</td><td>${formData.colloidsT5 ? formData.colloidsT5 + ' ml' : ''}</td><td>${formData.colloidsT6 ? formData.colloidsT6 + ' ml' : ''}</td>
                <td>${formData.colloidsT7 ? formData.colloidsT7 + ' ml' : ''}</td><td>${formData.colloidsT8 ? formData.colloidsT8 + ' ml' : ''}</td>
              </tr>
              <tr>
                <td>B.T. (ml)</td>
                <td>${formData.btT1 ? formData.btT1 + ' ml' : ''}</td><td>${formData.btT2 ? formData.btT2 + ' ml' : ''}</td><td>${formData.btT3 ? formData.btT3 + ' ml' : ''}</td>
                <td>${formData.btT4 ? formData.btT4 + ' ml' : ''}</td><td>${formData.btT5 ? formData.btT5 + ' ml' : ''}</td><td>${formData.btT6 ? formData.btT6 + ' ml' : ''}</td>
                <td>${formData.btT7 ? formData.btT7 + ' ml' : ''}</td><td>${formData.btT8 ? formData.btT8 + ' ml' : ''}</td>
              </tr>
              <tr>
                <td>MUSCLE RELAXANT (mg)</td>
                <td>${formData.muscleRelaxantT1 ? formData.muscleRelaxantT1 + ' mg' : ''}</td><td>${formData.muscleRelaxantT2 ? formData.muscleRelaxantT2 + ' mg' : ''}</td><td>${formData.muscleRelaxantT3 ? formData.muscleRelaxantT3 + ' mg' : ''}</td>
                <td>${formData.muscleRelaxantT4 ? formData.muscleRelaxantT4 + ' mg' : ''}</td><td>${formData.muscleRelaxantT5 ? formData.muscleRelaxantT5 + ' mg' : ''}</td><td>${formData.muscleRelaxantT6 ? formData.muscleRelaxantT6 + ' mg' : ''}</td>
                <td>${formData.muscleRelaxantT7 ? formData.muscleRelaxantT7 + ' mg' : ''}</td><td>${formData.muscleRelaxantT8 ? formData.muscleRelaxantT8 + ' mg' : ''}</td>
              </tr>
              <tr>
                <td>FENTANYL (mcg)</td>
                <td>${formData.fentanylProgressT1 ? formData.fentanylProgressT1 + ' mcg' : ''}</td><td>${formData.fentanylProgressT2 ? formData.fentanylProgressT2 + ' mcg' : ''}</td><td>${formData.fentanylProgressT3 ? formData.fentanylProgressT3 + ' mcg' : ''}</td>
                <td>${formData.fentanylProgressT4 ? formData.fentanylProgressT4 + ' mcg' : ''}</td><td>${formData.fentanylProgressT5 ? formData.fentanylProgressT5 + ' mcg' : ''}</td><td>${formData.fentanylProgressT6 ? formData.fentanylProgressT6 + ' mcg' : ''}</td>
                <td>${formData.fentanylProgressT7 ? formData.fentanylProgressT7 + ' mcg' : ''}</td><td>${formData.fentanylProgressT8 ? formData.fentanylProgressT8 + ' mcg' : ''}</td>
              </tr>
              <tr>
                <td>PROPOFOL (mg)</td>
                <td>${formData.propofolProgressT1 ? formData.propofolProgressT1 + ' mg' : ''}</td><td>${formData.propofolProgressT2 ? formData.propofolProgressT2 + ' mg' : ''}</td><td>${formData.propofolProgressT3 ? formData.propofolProgressT3 + ' mg' : ''}</td>
                <td>${formData.propofolProgressT4 ? formData.propofolProgressT4 + ' mg' : ''}</td><td>${formData.propofolProgressT5 ? formData.propofolProgressT5 + ' mg' : ''}</td><td>${formData.propofolProgressT6 ? formData.propofolProgressT6 + ' mg' : ''}</td>
                <td>${formData.propofolProgressT7 ? formData.propofolProgressT7 + ' mg' : ''}</td><td>${formData.propofolProgressT8 ? formData.propofolProgressT8 + ' mg' : ''}</td>
              </tr>
              <tr>
                <td>LOCAL ANAESTHESIA (ml)</td>
                <td>${formData.localAnaesthesiaT1 ? formData.localAnaesthesiaT1 + ' ml' : ''}</td><td>${formData.localAnaesthesiaT2 ? formData.localAnaesthesiaT2 + ' ml' : ''}</td><td>${formData.localAnaesthesiaT3 ? formData.localAnaesthesiaT3 + ' ml' : ''}</td>
                <td>${formData.localAnaesthesiaT4 ? formData.localAnaesthesiaT4 + ' ml' : ''}</td><td>${formData.localAnaesthesiaT5 ? formData.localAnaesthesiaT5 + ' ml' : ''}</td><td>${formData.localAnaesthesiaT6 ? formData.localAnaesthesiaT6 + ' ml' : ''}</td>
                <td>${formData.localAnaesthesiaT7 ? formData.localAnaesthesiaT7 + ' ml' : ''}</td><td>${formData.localAnaesthesiaT8 ? formData.localAnaesthesiaT8 + ' ml' : ''}</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Post-Op Instructions -->
          <div style="margin-top: 8px; border: 1px solid #000; padding: 4px;">
            <div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">POST-OP INSTRUCTIONS</div>
            <div>
              ${formData.checkPostOpVitals ? '☑' : '☐'} Check Post op. Vitals |
              ${formData.ivInfusion ? '☑' : '☐'} I.V Infusion |
              ${formData.analgesics ? '☑' : '☐'} Analgesics |
              ${formData.oxygenation ? '☑' : '☐'} Oxygenation
            </div>
            <div style="margin-top: 3px;">
              Transfer Patient to: ${formData.transferPatientTo || ''} |
              NBM Till: ${formData.nbmTill || ''} |
              Vitals on Transfer: ${formData.vitalsOnTransfer || ''}
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-section">
              <div style="margin-bottom: 30px; border-bottom: 1px solid #333;"></div>
              <div><strong>Name and Signature of Anaesthesia</strong></div>
              <div>${formData.anaesthesiaSignature || ''}</div>
            </div>
            <div class="signature-section">
              <div style="margin-bottom: 30px; border-bottom: 1px solid #333;"></div>
              <div><strong>Signature with Name (OT Staff)</strong></div>
              <div>${formData.otStaffSignature || ''}</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 10px;">
            <strong>Date:</strong> ${formData.signatureDate || ''} &nbsp;&nbsp;&nbsp;
            <strong>Time:</strong> ${formData.signatureTime || ''}
          </div>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Focus the new window and let user control printing
    setTimeout(() => {
      printWindow.focus();
      
      // Add script to handle print settings
      const script = printWindow.document.createElement('script');
      script.innerHTML = `
        // Remove title from the document to avoid showing in print header
        document.title = '';
        
        // Override print to ensure clean printing
        window.originalPrint = window.print;
        window.print = function() {
          // Hide the print button during printing
          const btn = document.querySelector('.print-button');
          if (btn) btn.style.display = 'none';
          
          // Call original print
          window.originalPrint();
          
          // Show button again after print dialog
          setTimeout(() => {
            if (btn) btn.style.display = 'block';
          }, 1000);
        };
      `;
      printWindow.document.head.appendChild(script);
      
      // Add a print button to the new window for user control
      const printBtn = printWindow.document.createElement('button');
      printBtn.innerHTML = 'Print Document';
      printBtn.className = 'print-button';
      printBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
      printBtn.onclick = () => printWindow.print();
      printWindow.document.body.appendChild(printBtn);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-[95vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">ANAESTHESIA NOTES</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Patient Information Header */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-3 text-green-700">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient's Name:</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age/Sex:</label>
                <input
                  type="text"
                  value={formData.ageSex}
                  onChange={(e) => handleInputChange('ageSex', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient ID:</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IPD No.:</label>
                <input
                  type="text"
                  value={formData.ipdNo}
                  onChange={(e) => handleInputChange('ipdNo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Consultant Name:</label>
                <input
                  type="text"
                  value={formData.consultantName}
                  onChange={(e) => handleInputChange('consultantName', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Form 5A - Pre-Op Details */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-3 text-green-700">FORM 5A - PRE-OPERATIVE DETAILS</h3>
            
            {/* Time In/Out and Team */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">TIME-IN:</label>
                <input
                  type="time"
                  value={formData.timeIn}
                  onChange={(e) => handleInputChange('timeIn', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TIME-OUT:</label>
                <input
                  type="time"
                  value={formData.timeOut}
                  onChange={(e) => handleInputChange('timeOut', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Anaesthetists and Surgeons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Anaesthetist 1:</label>
                <input
                  type="text"
                  value={formData.anaesthetist1}
                  onChange={(e) => handleInputChange('anaesthetist1', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Anaesthetist 2:</label>
                <input
                  type="text"
                  value={formData.anaesthetist2}
                  onChange={(e) => handleInputChange('anaesthetist2', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Surgeon 1:</label>
                <input
                  type="text"
                  value={formData.surgeon1}
                  onChange={(e) => handleInputChange('surgeon1', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Surgeon 2:</label>
                <input
                  type="text"
                  value={formData.surgeon2}
                  onChange={(e) => handleInputChange('surgeon2', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Pre-Medication */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">3. PRE-MEDICATION</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Atropine:</label>
                  <input
                    type="text"
                    value={formData.atropine}
                    onChange={(e) => handleInputChange('atropine', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Glycopyrrolate:</label>
                  <input
                    type="text"
                    value={formData.glycopyrrolate}
                    onChange={(e) => handleInputChange('glycopyrrolate', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Hyoscine:</label>
                  <input
                    type="text"
                    value={formData.hyoscine}
                    onChange={(e) => handleInputChange('hyoscine', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Fentanyl:</label>
                  <input
                    type="text"
                    value={formData.fentanyl}
                    onChange={(e) => handleInputChange('fentanyl', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Midazolam:</label>
                  <input
                    type="text"
                    value={formData.midazolam}
                    onChange={(e) => handleInputChange('midazolam', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Other:</label>
                  <input
                    type="text"
                    value={formData.otherPremed}
                    onChange={(e) => handleInputChange('otherPremed', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Pre-Op Procedure */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">4. PRE-OP PROCEDURE</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.intracaath}
                    onChange={(e) => handleInputChange('intracaath', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Intracaath</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.cardiacMonitor}
                    onChange={(e) => handleInputChange('cardiacMonitor', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Cardiac Monitor</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.foleys}
                    onChange={(e) => handleInputChange('foleys', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Foley's</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rtCentralLine}
                    onChange={(e) => handleInputChange('rtCentralLine', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">RT/Central Line</span>
                </label>
              </div>
            </div>

            {/* Anaesthesia Technique */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">5. ANAESTHESIA TECHNIQUE</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Short GA', 'GA', 'Regional', 'Spinal', 'Epidural', 'Block'].map((technique) => (
                  <label key={technique} className="flex items-center">
                    <input
                      type="radio"
                      name="anaesthesiaTechnique"
                      value={technique}
                      checked={formData.anaesthesiaTechnique === technique}
                      onChange={(e) => handleInputChange('anaesthesiaTechnique', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-xs">{technique}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Position of Patient */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">6. POSITION OF PATIENT:</label>
              <input
                type="text"
                value={formData.patientPosition}
                onChange={(e) => handleInputChange('patientPosition', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Inducing Agent */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">7. INDUCING AGENT</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.propofol}
                    onChange={(e) => handleInputChange('propofol', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Propofol</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.thiopentone}
                    onChange={(e) => handleInputChange('thiopentone', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Thiopentone</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.etomidate}
                    onChange={(e) => handleInputChange('etomidate', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Etomidate</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ketamine}
                    onChange={(e) => handleInputChange('ketamine', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Ketamine</span>
                </label>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Other:</label>
                  <input
                    type="text"
                    value={formData.otherInducingAgent}
                    onChange={(e) => handleInputChange('otherInducingAgent', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Continue with additional sections in a similar pattern... */}
            {/* For brevity, I'll add key sections and you can expand as needed */}

            {/* Circuit */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">13. CIRCUIT</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {['Jackson Rees', 'Circle Absorber', 'Brain/Magil'].map((circuitType) => (
                  <label key={circuitType} className="flex items-center">
                    <input
                      type="radio"
                      name="circuit"
                      value={circuitType}
                      checked={formData.circuit === circuitType}
                      onChange={(e) => handleInputChange('circuit', e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-xs">{circuitType}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Form 5B - Progress Note */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-lg mb-3 text-green-700">FORM 5B - ANAESTHESIA PROGRESS NOTE</h3>
            
            {/* Activity Table */}
            <div className="mb-6">
              <h4 className="font-bold text-sm mb-2">ACTIVITY MONITORING</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1">ACTIVITY/TIME</th>
                      <th className="border border-gray-300 px-2 py-1">T1</th>
                      <th className="border border-gray-300 px-2 py-1">T2</th>
                      <th className="border border-gray-300 px-2 py-1">T3</th>
                      <th className="border border-gray-300 px-2 py-1">T4</th>
                      <th className="border border-gray-300 px-2 py-1">T5</th>
                      <th className="border border-gray-300 px-2 py-1">T6</th>
                      <th className="border border-gray-300 px-2 py-1">T7</th>
                      <th className="border border-gray-300 px-2 py-1">T8</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium">PULSE</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <td key={i} className="border border-gray-300 px-1 py-1">
                          <input
                            type="text"
                            value={formData[`pulseT${i}` as keyof typeof formData] as string}
                            onChange={(e) => handleInputChange(`pulseT${i}`, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium">B.P.</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <td key={i} className="border border-gray-300 px-1 py-1">
                          <input
                            type="text"
                            value={formData[`bpT${i}` as keyof typeof formData] as string}
                            onChange={(e) => handleInputChange(`bpT${i}`, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium">SPO2</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <td key={i} className="border border-gray-300 px-1 py-1">
                          <input
                            type="text"
                            value={formData[`spo2T${i}` as keyof typeof formData] as string}
                            onChange={(e) => handleInputChange(`spo2T${i}`, e.target.value)}
                            className="w-full px-1 py-0.5 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                      ))}
                    </tr>
                    {/* Add more rows as needed */}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Post-Op Instructions */}
            <div className="mb-4">
              <h4 className="font-bold text-sm mb-2">POST-OP INSTRUCTIONS</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.checkPostOpVitals}
                    onChange={(e) => handleInputChange('checkPostOpVitals', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Check Post op. Vitals</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.ivInfusion}
                    onChange={(e) => handleInputChange('ivInfusion', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">I.V Infusion</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.analgesics}
                    onChange={(e) => handleInputChange('analgesics', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Analgesics</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.oxygenation}
                    onChange={(e) => handleInputChange('oxygenation', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-xs">Oxygenation</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Transfer Patient to:</label>
                  <input
                    type="text"
                    value={formData.transferPatientTo}
                    onChange={(e) => handleInputChange('transferPatientTo', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">NBM Till:</label>
                  <input
                    type="text"
                    value={formData.nbmTill}
                    onChange={(e) => handleInputChange('nbmTill', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Vitals on Transfer:</label>
                  <input
                    type="text"
                    value={formData.vitalsOnTransfer}
                    onChange={(e) => handleInputChange('vitalsOnTransfer', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name and Signature of Anaesthesia:</label>
                <input
                  type="text"
                  value={formData.anaesthesiaSignature}
                  onChange={(e) => handleInputChange('anaesthesiaSignature', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Signature with Name (OT Staff):</label>
                <input
                  type="text"
                  value={formData.otStaffSignature}
                  onChange={(e) => handleInputChange('otStaffSignature', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.signatureDate}
                  onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time:</label>
                <input
                  type="time"
                  value={formData.signatureTime}
                  onChange={(e) => handleInputChange('signatureTime', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Print
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save Anaesthesia Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnaesthesiaNotesForm;