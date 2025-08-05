import fs from "fs";
const content = fs.readFileSync("src/components/IPDBedManagement.tsx", "utf8");
fs.writeFileSync("src/components/IPDBedManagement.tsx.backup_ui_final", content);
console.log("Backup created. Making changes...");

