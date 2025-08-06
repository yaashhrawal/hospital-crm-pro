// Alternative Fix for bedService.ts
// If you cannot or don't want to add the treating_doctor column to the database,
// you can remove it from the insert statement in bedService.ts

// In bedService.ts, around line 165-175, change the insert from:
/*
const { data: admissionData, error: admissionError } = await supabase
  .from('patient_admissions')
  .insert({
    patient_id: patient.id,
    bed_number: bedData?.bed_number ? parseInt(bedData.bed_number) : 1,
    room_type: bedData?.room_type || 'GENERAL',
    department: patient.assigned_department || 'GENERAL',
    admission_date: admissionDateToUse,
    status: 'ADMITTED',
    treating_doctor: patient.assigned_doctor || 'Not Assigned',  // <-- REMOVE THIS LINE
    hospital_id: bedData?.hospital_id || 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d'
  })
*/

// To this (without treating_doctor):
/*
const { data: admissionData, error: admissionError } = await supabase
  .from('patient_admissions')
  .insert({
    patient_id: patient.id,
    bed_number: bedData?.bed_number ? parseInt(bedData.bed_number) : 1,
    room_type: bedData?.room_type || 'GENERAL',
    department: patient.assigned_department || 'GENERAL',
    admission_date: admissionDateToUse,
    status: 'ADMITTED',
    hospital_id: bedData?.hospital_id || 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d'
  })
*/

// Note: The treating doctor information can still be stored in the patients table
// in the assigned_doctor field, which is already being used elsewhere