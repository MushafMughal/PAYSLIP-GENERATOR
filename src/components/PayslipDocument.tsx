
import type React from 'react';
import type { CalculatedPayslipData } from '@/ai/flows/generate-payslip';
import Image from 'next/image';

interface PayslipDocumentProps {
  data: CalculatedPayslipData;
  id?: string; // For html2canvas to target
}

const formatCurrency = (amount: number | string | undefined) => {
  const num = parseFloat(String(amount || 0));
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const PayslipDocument: React.FC<PayslipDocumentProps> = ({ data, id }) => {
  const {
    employeeDetails,
    payDate,
    payPeriod,
    totalEarnings,
    totalDeductions,
    netPayable,
    netPayableInWords,
    employerName,
    employerAddress,
    employerPhone,
    paymentDetails,
    footerNote,
    // logoUrl is now fixed but we keep it in data for consistency if needed elsewhere
  } = data;

  return (
    <div id={id} className="p-8 bg-white text-gray-800 font-sans" style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Arial', sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-700">Payslip</h1>
          <p className="text-sm text-gray-600 mt-2">Pay Date : {payDate}</p>
          <p className="text-sm text-gray-600 mt-1">Pay Period : {payPeriod}</p>
        </div>
        <div className="text-right">
          <Image src="/Logo.jpg" alt="Company Logo" width={150} height={50} data-ai-hint="company logo" />
        </div>
      </div>

      {/* Employee and Employer Details */}
      <div className="grid grid-cols-2 gap-x-8 mb-10 text-sm">
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Employee Details</h2>
          <p className="mb-1">{employeeDetails['Full Name']}</p>
          <p className="mb-1">CNIC: {employeeDetails['CNIC Number']}</p>
          <p className="mb-1">{employeeDetails.Designation}</p>
          <p>DOJ: {employeeDetails['Date Of Joining']}</p>
        </div>
        <div className="text-right">
            <h2 className="font-semibold text-gray-700 mb-3">Employer Details</h2>
            <p className="font-bold mb-1">{employerName}</p>
            <p className="mb-1">{employerAddress}</p>
            <p>Phone & WhatsApp: {employerPhone}</p>
        </div>
      </div>

      {/* Earnings */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-700 bg-gray-100 px-4 py-2 border-y border-gray-300">Earnings</h2>
        <table className="w-full text-sm mt-1">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Gross Salary</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Gross Salary'])}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Bonus / Commission</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Bonus / Commission'])}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Reimbursement</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Reimbursment Amount'])}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Increment</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails.Increment)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Compensation</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails.Compensation)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Adjustments</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails.Adjustments)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Deductions */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-700 bg-gray-100 px-4 py-2 border-y border-gray-300">Deductions</h2>
        <table className="w-full text-sm mt-1">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Absents</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Absents Deduction'])}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Lates</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Lates Deduction'])}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Payroll Tax</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Payroll Tax Deduction'])}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-2 px-4">Others</td>
              <td className="py-2 px-4 text-right">{formatCurrency(employeeDetails['Other Deductions'])}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Summary Section */}
      <div className="mb-10">
        <div className="bg-blue-50 p-5 border border-blue-100 rounded-lg shadow-md">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs mb-1">TOTAL EARNINGS</div>
              <div className="font-semibold text-gray-800 flex items-center">
                <span className="mr-2">PKR</span>
                <span className="text-lg whitespace-nowrap ml-auto">{formatCurrency(totalEarnings)}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-md border border-gray-100 shadow-sm">
              <div className="text-gray-500 text-xs mb-1">TOTAL DEDUCTIONS</div>
              <div className="font-semibold text-gray-800 flex justify-between items-center">
                <span>PKR</span>
                <span className="text-lg whitespace-nowrap">{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-200 my-4 pt-4">
            <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-md">
              <span className="font-bold">NET PAYABLE</span>
              <span className="font-bold text-xl whitespace-nowrap">PKR {formatCurrency(netPayable)}</span>
            </div>
            <div className="bg-white p-3 mt-3 rounded-md border border-gray-100">
              <div className="text-xs text-blue-600 font-medium mb-1">AMOUNT IN WORDS</div>
              <div className="text-gray-700">{netPayableInWords}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-12 text-sm">
        <h2 className="font-semibold text-gray-700 mb-2">Payment Details</h2>
        <p className="text-gray-600">{paymentDetails}</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-6 mt-auto">
        <hr className="border-t border-gray-200 mb-6" />
        <p>{footerNote}</p>
      </div>
    </div>
  );
};
