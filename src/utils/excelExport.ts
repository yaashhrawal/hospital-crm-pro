// Excel export utility using client-side CSV generation
// No external dependencies needed

interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers: string[];
  data: any[];
  formatters?: { [key: string]: (value: any) => string };
}

export const exportToExcel = ({
  filename,
  sheetName = 'Sheet1',
  headers,
  data,
  formatters = {}
}: ExcelExportOptions) => {
  try {
    // Convert data to CSV format
    const csvContent = convertToCSV(headers, data, formatters);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

const convertToCSV = (headers: string[], data: any[], formatters: { [key: string]: (value: any) => string }) => {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(header => escapeCSVValue(header)).join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_');
      let value = row[key] || row[header] || '';
      
      // Apply formatter if available
      if (formatters[key]) {
        value = formatters[key](value);
      }
      
      return escapeCSVValue(String(value));
    });
    
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

const escapeCSVValue = (value: string): string => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, newline, or quotes, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape existing quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }
  
  return stringValue;
};

// Advanced Excel export with multiple sheets (for future use)
export const exportMultiSheetExcel = (sheets: ExcelExportOptions[], filename: string) => {
  // For now, export the first sheet only
  // In the future, we could implement proper Excel format with libraries like xlsx
  if (sheets.length > 0) {
    return exportToExcel({
      ...sheets[0],
      filename
    });
  }
  return false;
};

// Format currency for export - clean numeric value for Excel
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Format currency for Excel export - returns clean number without currency symbols
export const formatCurrencyForExcel = (amount: number): string => {
  return amount.toString();
};

// Format currency with Rupee symbol for Excel export
export const formatCurrencyWithSymbol = (amount: number): string => {
  return `₹${amount}`;
};

// Format date for export
export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-IN');
  } catch (error) {
    console.error('Error formatting date:', date, error);
    return 'Invalid Date';
  }
};

// Format date and time for export
export const formatDateTime = (datetime: string | Date): string => {
  if (!datetime) return '';
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return `${dateObj.toLocaleDateString('en-IN')} ${dateObj.toLocaleTimeString('en-IN')}`;
};