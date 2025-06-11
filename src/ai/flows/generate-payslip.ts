
'use server';
/**
 * @fileOverview Calculates payslip data based on employee input.
 *
 * - generatePayslipData - A function that processes employee data and calculates payslip details.
 * - GeneratePayslipDataInput - The input type for the generatePayslipData function.
 * - CalculatedPayslipData - The return type for the generatePayslipData function.
 */

import { z } from 'genkit'; // Using genkit's Zod for schema consistency, not for AI flow
import { numberToWords } from '@/lib/numberToWords';
import type { EmployeeDataForPayslip } from '@/lib/excelParser'; // Use a specific type for input

// Schema for the data expected from the Excel sheet, used as input for calculations
// Not exported directly to comply with 'use server' constraints
const GeneratePayslipDataInputSchema = z.object({
  Month: z.string().describe('The month for which the payslip is generated, e.g., "December 2024".'),
  'Full Name': z.string().describe('The full name of the employee.'),
  'CNIC Number': z.string().describe('The CNIC number of the employee.'),
  Designation: z.string().describe('The designation of the employee.'),
  'Date Of Joining': z.string().describe('The date of joining of the employee.'),
  'Gross Salary': z.string().describe('The gross salary of the employee.'),
  'Bonus / Commission': z.string().describe('The bonus or commission amount for the employee.'),
  Increment: z.string().describe('The increment amount for the employee.'),
  'Reimbursment Amount': z.string().describe('The reimbursement amount for the employee.'),
  Compensation: z.string().describe('The compensation amount for the employee.'),
  Adjustments: z.string().describe('The adjustments amount for the employee.'),
  'Absents Deduction': z.string().describe('The absents deduction amount for the employee.'),
  'Lates Deduction': z.string().describe('The lates deduction amount for the employee.'),
  'Other Deductions': z.string().describe('Other deductions amount for the employee.'),
  'Payroll Tax Deduction': z.string().describe('The payroll tax deduction amount for the employee.'),
});
export type GeneratePayslipDataInput = z.infer<typeof GeneratePayslipDataInputSchema>;


// Not exported directly to comply with 'use server' constraints
const CalculatedPayslipDataSchema = z.object({
  employeeDetails: GeneratePayslipDataInputSchema, // Uses the internally defined schema
  payDate: z.string().describe('The date the payslip is generated, e.g., "DD/MM/YYYY".'),
  payPeriod: z.string().describe('The period for which the payslip is valid, typically the month and year.'),
  totalEarnings: z.number().describe('Sum of all earnings.'),
  totalDeductions: z.number().describe('Sum of all deductions.'),
  netPayable: z.number().describe('Net amount payable to the employee (Total Earnings - Total Deductions).'),
  netPayableInWords: z.string().describe('Net payable amount written in words, including currency.'),
  employerName: z.string().describe('Name of the employer company.'),
  employerAddress: z.string().describe('Address of the employer company.'),
  employerPhone: z.string().describe('Phone number of the employer company.'),
  paymentDetails: z.string().default('Payment made to employee\'s bank account.').describe('Details about how the payment is made.'),
  footerNote: z.string().default('This is a system generated payslip.').describe('A small note at the bottom of the payslip.'),
  logoUrl: z.string().optional().describe('URL for the company logo. Publicly accessible if possible, or use a placeholder.')
});
export type CalculatedPayslipData = z.infer<typeof CalculatedPayslipDataSchema>;


// This function is now a server-side utility for data processing, not an AI flow.
export async function generatePayslipData(input: EmployeeDataForPayslip): Promise<CalculatedPayslipData> {
  // Validate input with Zod
  const validatedInput = GeneratePayslipDataInputSchema.parse(input);

  const s = (val: string | number | undefined) => String(val || '0');

  const grossSalary = parseFloat(s(validatedInput['Gross Salary']));
  const bonusCommission = parseFloat(s(validatedInput['Bonus / Commission']));
  const increment = parseFloat(s(validatedInput.Increment));
  const reimbursmentAmount = parseFloat(s(validatedInput['Reimbursment Amount']));
  const compensation = parseFloat(s(validatedInput.Compensation));
  const adjustments = parseFloat(s(validatedInput.Adjustments));

  const absentsDeduction = parseFloat(s(validatedInput['Absents Deduction']));
  const latesDeduction = parseFloat(s(validatedInput['Lates Deduction']));
  const otherDeductions = parseFloat(s(validatedInput['Other Deductions']));
  const payrollTaxDeduction = parseFloat(s(validatedInput['Payroll Tax Deduction']));

  const totalEarnings = grossSalary + bonusCommission + increment + reimbursmentAmount + compensation + adjustments;
  const totalDeductions = absentsDeduction + latesDeduction + otherDeductions + payrollTaxDeduction;
  const netPayable = totalEarnings - totalDeductions;

  const currentDate = new Date();
  const payDate = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;

  // Updated logo path to be a relative path to the public directory
  const logoUrl = '/Logo.jpg';


  return {
    employeeDetails: validatedInput,
    payDate: payDate,
    payPeriod: validatedInput.Month,
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    totalDeductions: parseFloat(totalDeductions.toFixed(2)),
    netPayable: parseFloat(netPayable.toFixed(2)),
    netPayableInWords: `${numberToWords(Math.floor(netPayable))} PKR`, // Assuming currency is PKR and words for whole numbers.
    employerName: "ROBUST SUPPORT & SOLUTIONS",
    employerAddress: "Office No.501A, Fortune Tower, PECHS Block 6, Karachi, Pakistan",
    employerPhone: "0311-3859635",
    paymentDetails: "Payment made to employee's bank account.",
    footerNote: "This is a system generated payslip.",
    logoUrl: logoUrl,
  };
}
