import React, { useState } from 'react';
import { FileText, Calendar, User, Stethoscope, Activity } from 'lucide-react';
import ProcedureConsentForm from './forms/ProcedureConsentForm';
import ConsentAnaesthesiaForm from './forms/ConsentAnaesthesiaForm';
import HighRiskConsentForm from './forms/HighRiskConsentForm';
import ConsentVentilatorForm from './forms/ConsentVentilatorForm';
import ConsentSurgeryProcedureForm from './forms/ConsentSurgeryProcedureForm';
import type { PatientWithRelations } from '../config/supabaseNew';

interface IPDConsentsSectionProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: PatientWithRelations;
  bedNumber?: number;
  ipdNumber?: string;
  savedData?: any; // Saved consent forms data
  onSubmit?: (formId: string, data: any) => void; // Callback to save form data
}

const IPDConsentsSection: React.FC<IPDConsentsSectionProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  savedData,
  onSubmit
}) => {
  const [activeForm, setActiveForm] = useState<string | null>(null);

  // Debug log to see what saved data is being passed
  React.useEffect(() => {
    if (isOpen) {
      console.log('IPDConsentsSection opened with savedData:', savedData);
    }
  }, [isOpen, savedData]);

  const consentForms = [
    {
      id: 'procedure',
      title: 'Procedure Consent Form',
      description: 'Consent form for medical procedures',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      id: 'anaesthesia',
      title: 'Consent for Anaesthesia Form',
      description: 'Anaesthesia consent and risk assessment',
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      id: 'highrisk',
      title: 'High Risk Consent Form',
      description: 'High risk procedure consent',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-red-500'
    },
    {
      id: 'ventilator',
      title: 'Consent for Ventilator/NIV/BI PAP',
      description: 'Ventilator support consent form',
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      id: 'surgery',
      title: 'Consent for Surgery/Procedure',
      description: 'Surgical procedure consent form',
      icon: <User className="w-6 h-6" />,
      color: 'bg-orange-500'
    }
  ];

  const handleFormSelect = (formId: string) => {
    setActiveForm(formId);
  };

  const handleFormClose = () => {
    setActiveForm(null);
  };

  // Reset activeForm when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setActiveForm(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">IPD Consent Forms</h2>
            <p className="text-blue-100 text-sm mt-1">
              {patient && `Patient: ${patient.first_name} ${patient.last_name}`}
              {bedNumber && ` | Bed: ${bedNumber}`}
              {ipdNumber && ` | IPD No: ${ipdNumber}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!activeForm ? (
            // Forms Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consentForms.map((form) => {
                const hasSavedData = savedData && savedData[form.id];
                return (
                  <div
                    key={form.id}
                    className={`bg-white rounded-lg border-2 ${
                      hasSavedData 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200'
                    } hover:border-blue-300 transition-colors cursor-pointer shadow-md hover:shadow-lg`}
                    onClick={() => handleFormSelect(form.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className={`${form.color} text-white p-3 rounded-lg mr-4 relative`}>
                          {form.icon}
                          {hasSavedData && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {form.title}
                            </h3>
                            {hasSavedData && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                Saved
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{form.description}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          hasSavedData 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}>
                          {hasSavedData ? 'View Saved Form' : 'Open Form'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Individual Form Components
            <div>
              <div className="mb-4">
                <button
                  onClick={handleFormClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  ← Back to Forms List
                </button>
              </div>

              {activeForm === 'procedure' && (
                <ProcedureConsentForm
                  key={`procedure-${JSON.stringify(savedData?.procedure)}`}
                  patient={patient}
                  bedNumber={bedNumber}
                  ipdNumber={ipdNumber}
                  initialData={savedData?.procedure}
                  onSubmit={(data) => {
                    onSubmit?.('procedure', data);
                    // Auto-close form after save
                    setActiveForm(null);
                  }}
                />
              )}
              
              {activeForm === 'anaesthesia' && (
                <ConsentAnaesthesiaForm
                  key={`anaesthesia-${JSON.stringify(savedData?.anaesthesia)}`}
                  patient={patient}
                  bedNumber={bedNumber}
                  ipdNumber={ipdNumber}
                  initialData={savedData?.anaesthesia}
                  onSubmit={(data) => {
                    onSubmit?.('anaesthesia', data);
                    // Auto-close form after save
                    setActiveForm(null);
                  }}
                />
              )}
              
              {activeForm === 'highrisk' && (
                <HighRiskConsentForm
                  key={`highrisk-${JSON.stringify(savedData?.highrisk)}`}
                  patient={patient}
                  bedNumber={bedNumber}
                  ipdNumber={ipdNumber}
                  initialData={savedData?.highrisk}
                  onSubmit={(data) => {
                    onSubmit?.('highrisk', data);
                    // Auto-close form after save
                    setActiveForm(null);
                  }}
                />
              )}
              
              {activeForm === 'ventilator' && (
                <ConsentVentilatorForm
                  key={`ventilator-${JSON.stringify(savedData?.ventilator)}`}
                  patient={patient}
                  bedNumber={bedNumber}
                  ipdNumber={ipdNumber}
                  initialData={savedData?.ventilator}
                  onSubmit={(data) => {
                    onSubmit?.('ventilator', data);
                    // Auto-close form after save
                    setActiveForm(null);
                  }}
                />
              )}
              
              {activeForm === 'surgery' && (
                <ConsentSurgeryProcedureForm
                  key={`surgery-${JSON.stringify(savedData?.surgery)}`}
                  patient={patient}
                  bedNumber={bedNumber}
                  ipdNumber={ipdNumber}
                  initialData={savedData?.surgery}
                  onSubmit={(data) => {
                    onSubmit?.('surgery', data);
                    // Auto-close form after save
                    setActiveForm(null);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPDConsentsSection;