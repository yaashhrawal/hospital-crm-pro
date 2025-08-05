import fs from "fs";
let content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");

// Replace the entire Clinical Record button with Consent Form button in admission history
const clinicalRecordPattern = /onClick\(\) => handleShowClinicalRecord\(bed\)\}[\s\S]*?<span>Clinical Record<\/span>[\s\S]*?<\/button>/;

const consentFormButton = `onClick={() => handleShowConsentForm(bed)}
                            className={\}
                            disabled={false}
                            title="Access consent form"
                          >
                            <span>{bed.consentFormSubmitted ? "✅" : "📋"}</span>
                            <span>IPD Consent Form</span>
                            
                            {bed.consentFormSubmitted && (
                              <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </button>`;

content = content.replace(clinicalRecordPattern, consentFormButton);

fs.writeFileSync("src/components/IPDBedManagement.tsx", content);
console.log("✅ Replaced Clinical Record with Consent Form in admission history");
