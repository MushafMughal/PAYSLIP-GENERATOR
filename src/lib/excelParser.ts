
import * as XLSX from 'xlsx';

// This is the raw structure from Excel, ensuring all fields are present as strings first
export interface RawEmployeeExcelData {
  Month?: string;
  'Full Name'?: string;
  'CNIC Number'?: string;
  Designation?: string;
  'Date Of Joining'?: string;
  'Gross Salary'?: string;
  'Bonus / Commission'?: string;
  Increment?: string;
  'Reimbursment Amount'?: string;
  Compensation?: string;
  Adjustments?: string;
  'Absents Deduction'?: string;
  'Lates Deduction'?: string;
  'Other Deductions'?: string;
  'Payroll Tax Deduction'?: string;
  [key: string]: string | undefined; // Allow other string properties
}


// This is the data structure used by the application, including client-side state
export interface EmployeeData extends RawEmployeeExcelData {
  id: string; // Unique identifier for React lists
  Month: string; // Make non-optional after parsing and validation
  'Full Name': string; // Make non-optional
  'CNIC Number': string;
  Designation: string;
  'Date Of Joining': string;
  'Gross Salary': string;
  'Bonus / Commission': string;
  Increment: string;
  'Reimbursment Amount': string;
  Compensation: string;
  Adjustments: string;
  'Absents Deduction': string;
  'Lates Deduction': string;
  'Other Deductions': string;
  'Payroll Tax Deduction': string;
  payslipPdfUri?: string; 
  isGenerating?: boolean;
  generationError?: string;
  calculatedData?: any; 
}

// Specific type for data being sent to `generatePayslipData` function
// All fields must be present and are strings, as per Excel sheet.
export interface EmployeeDataForPayslip {
  Month: string;
  'Full Name': string;
  'CNIC Number': string;
  Designation: string;
  'Date Of Joining': string;
  'Gross Salary': string;
  'Bonus / Commission': string;
  Increment: string;
  'Reimbursment Amount': string;
  Compensation: string;
  Adjustments: string;
  'Absents Deduction': string;
  'Lates Deduction': string;
  'Other Deductions': string;
  'Payroll Tax Deduction': string;
}


// Expected columns in the Excel file
const EXPECTED_COLUMNS: (keyof EmployeeDataForPayslip)[] = [
  'Month', 'Full Name', 'CNIC Number', 'Designation', 'Date Of Joining', 
  'Gross Salary', 'Bonus / Commission', 'Increment', 'Reimbursment Amount', 
  'Compensation', 'Adjustments', 'Absents Deduction', 'Lates Deduction', 
  'Other Deductions', 'Payroll Tax Deduction'
];

export const parseExcel = (file: File): Promise<EmployeeData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          reject(new Error("Failed to read file."));
          return;
        }
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", rawNumbers: false });

        if (jsonData.length < 2) {
          reject(new Error("Excel sheet must contain at least a header row and one data row."));
          return;
        }

        const headers: string[] = jsonData[0].map(header => String(header).trim());
        const missingColumns = EXPECTED_COLUMNS.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          reject(new Error(`Missing expected columns: ${missingColumns.join(', ')}. Please ensure your Excel file has all required columns with exact names.`));
          return;
        }
        
        const parsedData: EmployeeData[] = jsonData.slice(1).map((row, index) => {
          const rawEmployee: RawEmployeeExcelData = {};
          headers.forEach((header, colIndex) => {
            const cellValue = row[colIndex];
            if (header === 'Date Of Joining' && cellValue instanceof Date) {
              const d = new Date(cellValue);
              let month = '' + (d.getMonth() + 1);
              let day = '' + d.getDate();
              const year = d.getFullYear();
              if (month.length < 2) month = '0' + month;
              if (day.length < 2) day = '0' + day;
              rawEmployee[header] = [day, month, year].join('/');
            } else {
              rawEmployee[header] = String(cellValue !== undefined ? cellValue : "").trim();
            }
          });

          const employee: Partial<EmployeeData> = { id: `employee-${index}` };
          let isValidRow = true;
          for (const col of EXPECTED_COLUMNS) {
            if (rawEmployee[col] === undefined || rawEmployee[col] === null) {
               if (col === 'Full Name') isValidRow = false;
               (employee as any)[col] = ""; 
            } else {
              (employee as any)[col] = String(rawEmployee[col]).trim();
            }
          }
          employee.Month = employee.Month || "";
          employee['Full Name'] = employee['Full Name'] || "";
          
          if (!isValidRow || !employee['Full Name']?.trim()) {
            return null; 
          }
          return employee as EmployeeData;

        }).filter(employee => employee !== null) as EmployeeData[];

        if (parsedData.length === 0) {
          reject(new Error("No valid employee data found. Ensure 'Full Name' is present for all employees."));
          return;
        }

        resolve(parsedData);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        if (error instanceof Error) {
          reject(new Error(`Error parsing Excel file: ${error.message}`));
        } else {
          reject(new Error("An unknown error occurred while parsing the Excel file."));
        }
      }
    };
    reader.onerror = (error) => {
      reject(new Error("Error reading file: " + error));
    };
    reader.readAsBinaryString(file);
  });
};
