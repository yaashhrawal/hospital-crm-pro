import fs from "fs";
let content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");

// Replace the broken admission history section with a fixed one
const brokenSection = /\{\/\* Admission History Section - Above TAT Timer \*\/\}[\s\S]*?\{\/\* TAT Section \*\/\}/;

const fixedSection = `{/* Admission History Section - Above TAT Timer */}
                  <div className="mt-3 mb-2 p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xs font-medium text-cyan-700">📚 ADMISSION HISTORY</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmissionHistory(bed.id)}
                        className={\}
                        disabled={false}
                        title="View admission history"
                      >
                        <span>{bed.clinicalRecordSubmitted ? "📚✅" : "📚"}</span>
                        <span>View History</span>
                        <span className={\}>
                          ▶
                        </span>
                        {bed.clinicalRecordSubmitted && (
                          <span className="bg-white text-green-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center ml-1">
                            ✓
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {/* Expanded Admission History Options */}
                    {expandedAdmissionHistoryBed === bed.id && (
                      <div className="mt-2 bg-white bg-opacity-80 p-2 rounded space-y-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleShowClinicalRecord(bed)}
                            className={\}
                            disabled={false}
                            title="Access clinical record"
                          >
                            <span>{bed.clinicalRecordSubmitted ? "📋✅" : "📋"}</span>
                            <span>Clinical Record</span>
                            {bed.clinicalRecordSubmitted && (
                              <span className="bg-white text-blue-600 rounded-full text-xs px-1 min-w-[16px] h-4 flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* TAT Section */}`;

content = content.replace(brokenSection, fixedSection);

fs.writeFileSync("src/components/IPDBedManagement.tsx", content);
console.log("✅ Fixed admission history section - removed TAT Assessment Form");
