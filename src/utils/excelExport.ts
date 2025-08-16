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
  data.forEach((row, rowIndex) => {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '_');
      let value = row[key] || row[header] || '';
      
      // Debug patient_tag specifically
      if (header === 'Patient Tag' && rowIndex === 0) {
        console.log(`🔍 Excel Export Key Mapping Debug:`, {
          header: header,
          key: key,
          row_keys: Object.keys(row),
          value_from_key: row[key],
          value_from_header: row[header],
          final_value: value,
          patient_tag_direct: row.patient_tag
        });
      }
      
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
  if (!date || date === '' || date === 'Invalid Date' || date === 'null' || date === 'undefined') {
    return 'N/A';
  }
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle various date formats
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        // ISO format YYYY-MM-DDTHH:mm:ss
        dateObj = new Date(date);
      } else if (date.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // MM/DD/YYYY format
        const [month, day, year] = date.split('/').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else if (date.match(/^\d{2}-\d{2}-\d{4}$/)) {
        // DD-MM-YYYY format
        const [day, month, year] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        // Try generic date parsing
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 1900 || dateObj.getFullYear() > 2100) {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

// Format date and time for export
export const formatDateTime = (datetime: string | Date): string => {
  if (!datetime) return '';
  const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime;
  return `${dateObj.toLocaleDateString('en-IN')} ${dateObj.toLocaleTimeString('en-IN')}`;
};