import fs from "fs";
let content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");

// 1. Replace Clinical Record with Consent Form in admission history section
content = content.replace(
  "onClick={() => handleShowClinicalRecord(bed)}",
  "onClick={() => handleShowConsentForm(bed)}"
);

content = content.replace(
  "Access clinical record",
  "Access consent form"
);

content = content.replace(
  "<span>Clinical Record</span>",
  "<span>IPD Consent Form</span>"
);

// 2. Update the button styling for consent form
content = content.replace(
  /bed\.clinicalRecordSubmitted[\s\S]*?"bg-blue-500 hover:bg-blue-600"[\s\S]*?: "bg-indigo-500 hover:bg-indigo-600"/,
  `bed.consentFormSubmitted 
                                ? "bg-green-500 hover:bg-green-600" 
                                : "bg-orange-500 hover:bg-orange-600"`
);

content = content.replace(
  /{bed\.clinicalRecordSubmitted \? "📋✅" : "📋"}/,
  "{bed.consentFormSubmitted ? \"✅\" : \"📋\"}"
);

content = content.replace(
  /\{bed\.clinicalRecordSubmitted &&/,
  "{bed.consentFormSubmitted &&"
);

// 3. Update admission history button conditions
content = content.replace(
  /bed\.clinicalRecordSubmitted/g,
  "bed.consentFormSubmitted"
);

// 4. Update TAT timer header
content = content.replace("TAT TIMER & CONSENT", "TAT TIMER");

fs.writeFileSync("src/components/IPDBedManagement.tsx", content);
console.log("✅ Successfully moved Consent Form to admission history");
