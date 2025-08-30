// Date utility functions for the Hospital CRM

export function getPatientTransactionDate(transaction: any, patient: any): string {
  // PRIORITY ORDER:
  // 1. Transaction's transaction_date (actual date of the transaction)
  // 2. Transaction's created_at date (fallback if no transaction_date)
  // 3. Patient's date_of_entry (only as last resort)
  
  if (transaction?.transaction_date) {
    // Handle both date formats (YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS)
    return transaction.transaction_date.includes('T') 
      ? transaction.transaction_date.split('T')[0]
      : transaction.transaction_date;
  }
  
  if (transaction?.created_at) {
    return transaction.created_at.split('T')[0];
  }
  
  if (patient?.date_of_entry) {
    return patient.date_of_entry;
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