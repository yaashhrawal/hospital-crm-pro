const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/components/ComprehensivePatientList.tsx', 'utf8');

// Replace the export headers
const oldHeaders = `        headers: [
          'Patient ID',
          'First Name',
          'Last Name', 
          'Phone',
          'Email',
          'Gender',
          'Age',
          'Address',
          'Date of Birth',
          'Medical History',
          'Allergies',
          'Patient Tag',
          'Emergency Contact',
          'Visit Count',
          'Department Status',
          'Total Spent',
          'Last Visit',
          'Registration Date'
        ],`;

const newHeaders = `        headers: [
          'Patient Name',
          'Patient ID',
          'Contact',
          'Visits',
          'Department',
          'Total Spent',
          'Last Visit'
        ],`;

// Replace the data mapping
const oldDataStart = `      const exportData = filteredPatients.map((patient) => {
        // Handle Date of Birth formatting
        let dobString = '';
        if (patient.date_of_birth) {
          const dobDate = new Date(patient.date_of_birth);
          if (!isNaN(dobDate.getTime())) {
            dobString = dobDate.toLocaleDateString();
          }
        }
        
        // Handle registration date for better formatting
        const regDate = patient.created_at;
        const formattedRegDate = formatDate(regDate);
        
        return {
          patient_id: patient.patient_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          phone: patient.phone || '',
          email: patient.email || '',
          gender: patient.gender || '',
          age: patient.age || '',
          address: patient.address || '',
          date_of_birth: patient.date_of_birth || '',
          medical_history: patient.medical_history || '',
          allergies: patient.allergies || '',
          patient_tag: patient.patient_tag || '',
          emergency_contact: patient.emergency_contact_name || '',
          visit_count: patient.visitCount || 0,
          department_status: patient.departmentStatus || 'OPD',
          total_spent: patient.totalSpent || 0, // Clean numeric value
          last_visit: formatDate(patient.lastVisit || patient.date_of_entry || ''),
          registration_date: patient.created_at || '', // Store raw date
        };
      });`;

const newDataStart = `      const exportData = filteredPatients.map((patient) => {        
        return {
          patient_name: \`\${patient.first_name} \${patient.last_name || ''}\`.trim(),
          patient_id: patient.patient_id,
          contact: patient.phone || '',
          visits: patient.visitCount || 0,
          department: patient.departmentStatus || 'OPD',
          total_spent: patient.totalSpent || 0,
          last_visit: formatDate(patient.lastVisit || patient.date_of_entry || ''),
        };
      });`;

// Replace formatters
const oldFormatters = `        formatters: {
          total_spent: (value) => formatCurrencyForExcel(value), // Clean numeric value
          last_visit: (value) => value ? formatDate(value) : 'Never',
          registration_date: (value) => value ? formatDate(value) : 'Unknown'
        }`;

const newFormatters = `        formatters: {
          total_spent: (value) => formatCurrencyForExcel(value),
          last_visit: (value) => value ? formatDate(value) : 'Never'
        }`;

// Apply replacements
content = content.replace(oldHeaders, newHeaders);
content = content.replace(oldDataStart, newDataStart);
content = content.replace(oldFormatters, newFormatters);

// Write the updated file
fs.writeFileSync('src/components/ComprehensivePatientList.tsx', content);
console.log('Excel export updated to match displayed columns!');
