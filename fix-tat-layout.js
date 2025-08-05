const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/components/IPDBedManagement.tsx', 'utf8');

console.log('File read successfully, length:', content.length);

// Create backup
fs.writeFileSync('src/components/IPDBedManagement.tsx.backup-layout', content);

// Find the section to replace
const startPattern = '{bed.admissionDate && (';
const endPattern = '{/* Notes and Consent Buttons - Only show for occupied beds */}';

const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern);

console.log('Start index:', startIndex);
console.log('End index:', endIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find the section to replace');
    process.exit(1);
}

// Extract the parts
const beforeSection = content.substring(0, startIndex);
const afterSection = content.substring(endIndex);

// Read the new middle section from a template file
const newMiddleSection = fs.readFileSync('new-section.txt', 'utf8');

// Create the new content
const newContent = beforeSection + newMiddleSection + afterSection;

// Write the new content
fs.writeFileSync('src/components/IPDBedManagement.tsx', newContent);

console.log('✅ Successfully updated IPDBedManagement.tsx');
ENDOFFILE < /dev/null
