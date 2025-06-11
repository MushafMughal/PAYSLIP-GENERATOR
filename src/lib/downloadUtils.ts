
import JSZip from 'jszip';
// file-saver is not used here to minimize dependencies, using manual anchor tag method.

export const downloadDataUri = (dataUri: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // For data URIs, revoking object URL is not necessary as it's not a Blob URL.
};

interface FileToZip {
  filename: string;
  dataUri: string;
}

export const downloadAllAsZip = async (files: FileToZip[], zipFileName: string = 'payslips.zip') => {
  const zip = new JSZip();

  files.forEach(file => {
    // Extract base64 data from data URI
    // Format: data:<mimetype>;base64,<encoded_data>
    const parts = file.dataUri.split(',');
    if (parts.length < 2) {
      console.error(`Invalid data URI for file ${file.filename}`);
      return; // Skip this file
    }
    const base64Data = parts[1];
    
    if (base64Data) {
      // Add .pdf extension if not present, useful if filename was generic
      const finalFilename = file.filename.toLowerCase().endsWith('.pdf') ? file.filename : `${file.filename}.pdf`;
      zip.file(finalFilename, base64Data, { base64: true });
    }
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href); // Clean up Blob URL
};
