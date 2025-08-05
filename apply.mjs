import fs from "fs";
let content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");
fs.writeFileSync("src/components/IPDBedManagement.tsx.backup_visible", content);
content = content.replace("{/* TAT Section */}", "{/* Admission History Section - Above TAT Timer */}
                  <div className=\"mt-3 mb-2 p-2 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200\">
                    <div className=\"flex items-center justify-center mb-2\">
                      <span className=\"text-xs font-medium text-cyan-700\">📚 ADMISSION HISTORY</span>
                    </div>
                  </div>
                  
                  {/* TAT Section with Consent Form */}");
fs.writeFileSync("src/components/IPDBedManagement.tsx", content);
console.log("✅ Added Admission History section above TAT Timer");