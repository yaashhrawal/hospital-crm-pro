import fs from "fs";
let content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");

// Replace Clinical Record with Consent Form in admission history
content = content.replace(
  /onClick\(\) => handleShowClinicalRecord\(bed\)\}/,
  "onClick={() => handleShowConsentForm(bed)}"
);

content = content.replace(
  /bed\.clinicalRecordSubmitted[\s\S]*?"bg-blue-500 hover:bg-blue-600"[\s\S]*?: "bg-indigo-500 hover:bg-indigo-600"/,
  `bed.consentFormSubmitted 
                                ? "bg-green-500 hover:bg-green-600" 
                                : "bg-orange-500 hover:bg-orange-600"`
);

content = content.replace(
  /title="Access clinical record"/,
  "title=\"Access consent form\""
);

content = content.replace(
  /<span>\{bed\.clinicalRecordSubmitted \? "📋✅" : "📋"\}<\/span>/,
  "<span>{bed.consentFormSubmitted ? \"✅\" : \"📋\"}</span>"
);

content = content.replace(
  /<span>Clinical Record<\/span>/,
  "<span>IPD Consent Form</span>"
);

content = content.replace(
  /\{bed\.clinicalRecordSubmitted &&/,
  "{bed.consentFormSubmitted &&"
);

content = content.replace(
  /text-blue-600 rounded-full/,
  "text-green-600 rounded-full"
);

fs.writeFileSync("src/components/IPDBedManagement.tsx", content);
console.log("✅ Replaced Clinical Record with Consent Form in admission history");
