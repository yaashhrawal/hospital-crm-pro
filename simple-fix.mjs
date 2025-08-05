import fs from "fs";
const content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");
fs.writeFileSync("src/components/IPDBedManagement.tsx.backup-fix", content);
const newContent = content.replace("{/* TAT Section with Integrated Admission History */}", "{/* TAT Section */}");
fs.writeFileSync("src/components/IPDBedManagement.tsx", newContent);
console.log("Updated TAT section comment");
