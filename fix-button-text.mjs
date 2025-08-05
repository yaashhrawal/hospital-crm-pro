import fs from "fs";
let content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");

// Make the changes in the admission history section very specific
content = content.replace(
  /<span>\{bed\.clinicalRecordSubmitted \? "📋✅" : "📋"\}<\/span>\s*<span>Clinical Record<\/span>/,
  "<span>{bed.consentFormSubmitted ? \"✅\" : \"📋\"}</span>\n                            <span>IPD Consent Form</span>"
);

fs.writeFileSync("src/components/IPDBedManagement.tsx", content);
console.log("✅ Fixed the button text and icon");
