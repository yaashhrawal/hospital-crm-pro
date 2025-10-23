import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF from HTML content
 * @param htmlContent - HTML string to convert to PDF
 * @param filename - Name for the PDF file (without extension)
 * @returns Base64 encoded PDF string
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  filename: string = 'receipt'
): Promise<string> {
  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px'; // Fixed width for consistent rendering
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Get canvas dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Convert to base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    console.log('✅ PDF generated successfully');
    return pdfBase64;
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generate and download PDF from HTML content
 * @param htmlContent - HTML string to convert to PDF
 * @param filename - Name for the downloaded PDF file
 */
export async function downloadPDFFromHTML(
  htmlContent: string,
  filename: string = 'receipt'
): Promise<void> {
  try {
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Get canvas dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Download PDF
    pdf.save(`${filename}.pdf`);

    console.log('✅ PDF downloaded successfully');
  } catch (error) {
    console.error('❌ PDF download error:', error);
    throw new Error('Failed to download PDF');
  }
}
