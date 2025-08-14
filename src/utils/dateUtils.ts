// Date utility functions for the Hospital CRM

export function getPatientTransactionDate(transaction: any, patient: any): string {
  // PRIORITY ORDER:
  // 1. Patient's date_of_entry (for backdate consistency)
  // 2. Transaction's transaction_date 
  // 3. Transaction's created_at date
  
  if (patient?.date_of_entry) {
    return patient.date_of_entry;
  }
  
  if (transaction?.transaction_date) {
    return transaction.transaction_date;
  }
  
  if (transaction?.created_at) {
    return transaction.created_at.split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
}

export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN'); // DD/MM/YYYY format
  } catch {
    return dateString;
  }
}

export function getPatientEntryDate(patient: any): string {
  return patient?.date_of_entry || patient?.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
}