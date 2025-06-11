
"use client";

import React, { useState, useCallback } from 'react';
import type { EmployeeData, EmployeeDataForPayslip } from '@/lib/excelParser';
import { generatePayslipData, type CalculatedPayslipData } from '@/ai/flows/generate-payslip';
import { Button } from '@/components/ui/button';
import { Download, FileText as FilePdf, Loader2, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { downloadDataUri, downloadAllAsZip } from '@/lib/downloadUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
import { ExcelUploader } from '@/components/ExcelUploader';
import { PayslipTable } from '@/components/PayslipTable';


// Helper function to format currency for PDF
const formatCurrencyForPdf = (amount: string | number | undefined, currencySymbol: string = ''): string => {
  const num = parseFloat(String(amount || 0));
  // No currency symbol, just the number formatted to two decimal places
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function Home() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processingEmployeeId, setProcessingEmployeeId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDataParsed = useCallback((data: EmployeeData[]) => {
    setEmployees(data.map(emp => ({ ...emp, payslipPdfUri: undefined, generationError: undefined, isGenerating: false })));
  }, []);

  const updateEmployeeState = (id: string, updates: Partial<EmployeeData>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  };

  const generatePdfForEmployee = async (employeeData: CalculatedPayslipData): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Document Constants
        const A4_WIDTH = 210;
        const MARGIN = 15;
        const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN;
        
        // Colors
        const PRIMARY_BLUE_RGB = [48, 71, 94]; 
        const TEXT_COLOR_DARK_RGB = [0, 0, 0]; 
        const TEXT_COLOR_MUTED_RGB = [100, 100, 100];
        const BORDER_COLOR_LIGHT_RGB = [200, 200, 200];
        const SUMMARY_BOX_BG_RGB = [229, 231, 235]; 
        const SUMMARY_BOX_TEXT_RGB = [31, 41, 55]; 

        // Font Sizes
        const FONT_SIZE_TITLE = 22;
        const FONT_SIZE_SUBTITLE = 9;
        const FONT_SIZE_SECTION_HEADER = 11;
        const FONT_SIZE_NORMAL = 9;
        const FONT_SIZE_SMALL = 8;
        const FONT_SIZE_TABLE_HEADER_DESC = 8;

        // Line Heights & Gaps
        const LINE_HEIGHT_NORMAL = 6; 
        const LINE_HEIGHT_SMALL = 4.5; 
        const SECTION_SPACING = 7; // Reduced from 10
        const ITEM_SPACING = 3.5;    
        const TABLE_HEADER_BOTTOM_MARGIN = 2.5; 


        let currentY = MARGIN;

        const {
            employeeDetails, payDate, payPeriod, totalEarnings, totalDeductions,
            netPayable, netPayableInWords, employerName, employerAddress, employerPhone,
            paymentDetails, footerNote, logoUrl
        } = employeeData;


        const processPdfContent = async () => {
          pdf.setFont("Helvetica", "normal");
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);

          // 1. Header Section: Logo on the right, Payslip Title and Dates on the left
          let logoHeight = 15; 
          let logoWidth = 35; 
          let actualLogoHeight = logoHeight; 

          // Payslip Title and Dates on the LEFT
          pdf.setFontSize(FONT_SIZE_TITLE);
          pdf.setFont("Helvetica", "bold");
          pdf.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          const payslipTitle = "Payslip";
          const titleX = MARGIN;
          const titleYInitial = currentY + 7; // Initial Y for title, adjust based on logo later if needed
          pdf.text(payslipTitle, titleX, titleYInitial);

          pdf.setFontSize(FONT_SIZE_SUBTITLE);
          pdf.setFont("Helvetica", "normal");
          pdf.setTextColor(TEXT_COLOR_MUTED_RGB[0], TEXT_COLOR_MUTED_RGB[1], TEXT_COLOR_MUTED_RGB[2]); // Muted color for dates
          
          const payDateText = `Pay Date : ${payDate}`;
          const payPeriodText = `Pay Period : ${payPeriod.toUpperCase()}`;
          const subTitleYStart = titleYInitial + LINE_HEIGHT_NORMAL + ITEM_SPACING / 2;
          
          pdf.text(payDateText, titleX, subTitleYStart);
          pdf.text(payPeriodText, titleX, subTitleYStart + LINE_HEIGHT_SMALL);
          
          let headerTextHeight = (subTitleYStart + LINE_HEIGHT_SMALL) - currentY;


          // Logo on the RIGHT
          const logoX = A4_WIDTH - MARGIN - logoWidth; 
          const logoY = currentY;

          if (logoUrl) {
            try {
              const response = await fetch(logoUrl);
              if (!response.ok) throw new Error(`Logo not found at ${logoUrl}`);
              const blob = await response.blob();
              const reader = new FileReader();
              const logoBase64 = await new Promise<string>((resolveImg, rejectImg) => {
                reader.onloadend = () => resolveImg(reader.result as string);
                reader.onerror = rejectImg;
                reader.readAsDataURL(blob);
              });

              const img = new Image();
              await new Promise<void>((resolveImgLoad) => {
                img.onload = () => {
                  actualLogoHeight = (img.height * logoWidth) / img.width;
                  // Adjust titleY if logo is taller and title needs to be centered vertically with it
                  // const titleYAdjusted = logoY + (actualLogoHeight / 2) - (pdf.getLineHeight(payslipTitle) / pdf.internal.scaleFactor / 3);
                  // if(titleYAdjusted > titleYInitial) {
                  //    pdf.text(payslipTitle, titleX, titleYAdjusted); // Redraw if needed, or set Y before first draw
                  // }
                  pdf.addImage(logoBase64, 'JPEG', logoX, logoY, logoWidth, actualLogoHeight);
                  resolveImgLoad();
                };
                img.onerror = (err) => {
                  console.warn("Error loading image properties for PDF logo, skipping logo.", err);
                  resolveImgLoad(); 
                };
                img.src = logoBase64;
              });
            } catch (e) {
              console.warn("Could not load or add company logo for PDF:", e);
            }
          }
          
          currentY += Math.max(actualLogoHeight, headerTextHeight) + SECTION_SPACING * 1.5;
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]); // Reset text color

          // 2. Employee and Employer Details
          const empDetailsCol1X = MARGIN;
          const detailsStartY = currentY;
          let currentYCol1 = detailsStartY;
          let currentYCol2 = detailsStartY; 

          const addDetailWithBoldLabel = (label: string, value: string, x: number, y: number, labelWidth: number) => {
            const textYPos = y + (LINE_HEIGHT_NORMAL / 2) - (FONT_SIZE_NORMAL / pdf.internal.scaleFactor / 2.5); 
            pdf.setFontSize(FONT_SIZE_NORMAL);
            pdf.setFont("Helvetica", "bold"); 
            pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);
            pdf.text(label, x, textYPos);
            pdf.setFont("Helvetica", "normal");
            pdf.text(String(value), x + labelWidth, textYPos);
            return y + LINE_HEIGHT_NORMAL;
          };
          
          pdf.setFontSize(FONT_SIZE_SECTION_HEADER);
          pdf.setFont("Helvetica", "bold");
          pdf.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          pdf.text("Employee Details", empDetailsCol1X, currentYCol1);
          currentYCol1 += LINE_HEIGHT_NORMAL * 1.5;

          const employeeLabelWidth = 28; 
          currentYCol1 = addDetailWithBoldLabel("Name:", employeeDetails['Full Name'], empDetailsCol1X, currentYCol1, employeeLabelWidth);
          currentYCol1 = addDetailWithBoldLabel("CNIC:", employeeDetails['CNIC Number'], empDetailsCol1X, currentYCol1, employeeLabelWidth);
          currentYCol1 = addDetailWithBoldLabel("Designation:", employeeDetails.Designation, empDetailsCol1X, currentYCol1, employeeLabelWidth);
          currentYCol1 = addDetailWithBoldLabel("DOJ:", employeeDetails['Date Of Joining'], empDetailsCol1X, currentYCol1, employeeLabelWidth);
          
          // Employer Details - Right Aligned with right-aligned text
          const empDetailsTextWrapWidth = CONTENT_WIDTH * 0.45; 
          const empDetailsCol2X = A4_WIDTH - MARGIN; 

          pdf.setFontSize(FONT_SIZE_SECTION_HEADER);
          pdf.setFont("Helvetica", "bold");
          pdf.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          pdf.text("Employer Details", empDetailsCol2X, currentYCol2, { align: "right" });
          currentYCol2 += LINE_HEIGHT_NORMAL * 1.5;
          
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);
          pdf.setFontSize(FONT_SIZE_NORMAL);
          pdf.setFont("Helvetica", "bold"); 
          pdf.text(employerName, empDetailsCol2X, currentYCol2, { align: "right" }); currentYCol2 += LINE_HEIGHT_NORMAL;
          
          pdf.setFont("Helvetica", "normal");
          const employerAddressLines = pdf.splitTextToSize(employerAddress, empDetailsTextWrapWidth);
          // For each line of the address, align it to the right
          for (let i = 0; i < employerAddressLines.length; i++) {
            pdf.text(employerAddressLines[i], empDetailsCol2X, currentYCol2 + (i * LINE_HEIGHT_SMALL), { align: "right" });
          }
          currentYCol2 += (employerAddressLines.length * LINE_HEIGHT_SMALL) + (employerAddressLines.length > 1 ? ITEM_SPACING/2 : 0);
          
          const phoneLabel = "Phone & WhatsApp: "; 
          pdf.text(`${phoneLabel}${employerPhone}`, empDetailsCol2X, currentYCol2, { align: "right" });

          currentY = Math.max(currentYCol1, currentYCol2) + SECTION_SPACING * 1.5;

          // 3. Earnings & Deductions Tables
          const drawTable = (title: string, items: { label: string, value: string | number | undefined }[], startY: number): number => {
            let y = startY;
            const textYPosForHeader = y + (LINE_HEIGHT_NORMAL / 2) - (FONT_SIZE_SECTION_HEADER / pdf.internal.scaleFactor / 2.5);
            
            pdf.setFontSize(FONT_SIZE_SECTION_HEADER); 
            pdf.setFont("Helvetica", "bold");
            pdf.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
            pdf.text(title, MARGIN, textYPosForHeader);
            y += LINE_HEIGHT_NORMAL * 1.2; 

            const headerDescY = y + (LINE_HEIGHT_SMALL / 2) - (FONT_SIZE_TABLE_HEADER_DESC / pdf.internal.scaleFactor / 2.5);
            pdf.setFontSize(FONT_SIZE_TABLE_HEADER_DESC);
            pdf.setFont("Helvetica", "normal"); 
            pdf.setTextColor(TEXT_COLOR_MUTED_RGB[0], TEXT_COLOR_MUTED_RGB[1], TEXT_COLOR_MUTED_RGB[2]);
            pdf.text("Description", MARGIN, headerDescY);
            pdf.text("Amount (PKR)", A4_WIDTH - MARGIN, headerDescY, { align: 'right' });
            y += TABLE_HEADER_BOTTOM_MARGIN; 
            
            pdf.setDrawColor(BORDER_COLOR_LIGHT_RGB[0], BORDER_COLOR_LIGHT_RGB[1], BORDER_COLOR_LIGHT_RGB[2]);
            pdf.setLineWidth(0.2);
            pdf.line(MARGIN, y, A4_WIDTH - MARGIN, y); 
            y += ITEM_SPACING * 1.5;

            pdf.setFontSize(FONT_SIZE_NORMAL);
            pdf.setFont("Helvetica", "normal");
            pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);

            items.forEach(item => {
              // Always display all items, regardless of value
              const itemTextY = y + (LINE_HEIGHT_NORMAL / 2) - (FONT_SIZE_NORMAL / pdf.internal.scaleFactor / 2.5);
              pdf.text(item.label, MARGIN, itemTextY);
              pdf.text(formatCurrencyForPdf(item.value), A4_WIDTH - MARGIN, itemTextY, { align: 'right' });
              y += LINE_HEIGHT_NORMAL;
              pdf.setDrawColor(BORDER_COLOR_LIGHT_RGB[0], BORDER_COLOR_LIGHT_RGB[1], BORDER_COLOR_LIGHT_RGB[2]); 
              pdf.setLineWidth(0.1); 
              pdf.line(MARGIN, y - ITEM_SPACING / 1.5, A4_WIDTH - MARGIN, y - ITEM_SPACING / 1.5);
            });
            return y;
          };

          const earnings = [
              { label: "Gross Salary", value: employeeDetails['Gross Salary'] },
              { label: "Bonus / Commission", value: employeeDetails['Bonus / Commission'] },
              { label: "Reimbursement", value: employeeDetails['Reimbursment Amount'] },
              { label: "Increment", value: employeeDetails.Increment },
              { label: "Compensation", value: employeeDetails.Compensation },
              { label: "Adjustments", value: employeeDetails.Adjustments },
          ];
          currentY = drawTable("Earnings", earnings, currentY);
          currentY += SECTION_SPACING;

          const deductions = [
              { label: "Absents Deduction", value: employeeDetails['Absents Deduction'] },
              { label: "Lates Deduction", value: employeeDetails['Lates Deduction'] },
              { label: "Payroll Tax Deduction", value: employeeDetails['Payroll Tax Deduction'] },
              { label: "Other Deductions", value: employeeDetails['Other Deductions'] },
          ];
          currentY = drawTable("Deductions", deductions, currentY);
          currentY += SECTION_SPACING * 1.5; 

          // 4. Summary Section - Enhanced Design
          const summaryBoxPaddingX = 5;
          const summaryBoxPaddingY = 5;
          const summaryLineHeight = 7;
          const summaryBoxYstart = currentY;
          
          // Calculate the height for the enhanced summary container
          let summaryContentHeight = 40; // Increased height for the enhanced design
          
          // Main container - Light Blue Background
          pdf.setFillColor(235, 242, 252); // Light blue background
          pdf.setDrawColor(200, 220, 245); // Light blue border
          pdf.setLineWidth(0.3);
          pdf.roundedRect(MARGIN, summaryBoxYstart, CONTENT_WIDTH, summaryContentHeight, 3, 3, 'FD'); // Rounded corners
          
          // Draw two cards in a grid layout
          const cardWidth = CONTENT_WIDTH / 2 - summaryBoxPaddingX * 1.5;
          const cardHeight = 14;
          const cardY = summaryBoxYstart + summaryBoxPaddingY;
          
          // Card 1 - Total Earnings
          pdf.setFillColor(255, 255, 255); // White background
          pdf.setDrawColor(230, 230, 230); // Light gray border
          pdf.roundedRect(MARGIN + summaryBoxPaddingX, cardY, cardWidth, cardHeight, 2, 2, 'FD');
          
          // Card 1 content
          pdf.setTextColor(150, 150, 150); // Gray text
          pdf.setFontSize(FONT_SIZE_SMALL);
          pdf.setFont("Helvetica", "bold");
          pdf.text("TOTAL EARNINGS", MARGIN + summaryBoxPaddingX * 2, cardY + 4);
          
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);
          pdf.setFontSize(FONT_SIZE_NORMAL);
          
          // Create a more consistent layout with proper spacing
          const earningsValueText = formatCurrencyForPdf(totalEarnings);
          pdf.text("PKR", MARGIN + summaryBoxPaddingX * 2, cardY + 9);
          pdf.setFont("Helvetica", "bold");
          // Move the earnings value even further to the right
          pdf.text(earningsValueText, MARGIN + cardWidth, cardY + 9, { align: 'right' });
          
          // Card 2 - Total Deductions
          pdf.setFillColor(255, 255, 255); // White background
          pdf.setDrawColor(230, 230, 230); // Light gray border
          pdf.roundedRect(MARGIN + cardWidth + summaryBoxPaddingX * 2, cardY, cardWidth, cardHeight, 2, 2, 'FD');
          
          // Card 2 content
          pdf.setTextColor(150, 150, 150); // Gray text
          pdf.setFontSize(FONT_SIZE_SMALL);
          pdf.setFont("Helvetica", "bold");
          pdf.text("TOTAL DEDUCTIONS", MARGIN + cardWidth + summaryBoxPaddingX * 3, cardY + 4);
          
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);
          pdf.setFontSize(FONT_SIZE_NORMAL);
          
          // Create a more consistent layout with proper spacing
          const deductionsValueText = formatCurrencyForPdf(totalDeductions);
          pdf.text("PKR", MARGIN + cardWidth + summaryBoxPaddingX * 3, cardY + 9);
          pdf.setFont("Helvetica", "bold");
          // Keep the deductions value at its original position (not moved right)
          pdf.text(deductionsValueText, MARGIN + cardWidth * 2 + summaryBoxPaddingX, cardY + 9, { align: 'right' });
          
          // Divider
          pdf.setDrawColor(200, 220, 245); // Light blue line
          pdf.setLineWidth(0.3);
          pdf.line(MARGIN + summaryBoxPaddingX, cardY + cardHeight + 3, A4_WIDTH - MARGIN - summaryBoxPaddingX, cardY + cardHeight + 3);
          
          // Net Payable Box - Blue background
          const netPayableBoxY = cardY + cardHeight + 6;
          pdf.setFillColor(48, 71, 94); // Blue background
          pdf.setDrawColor(48, 71, 94); // Blue border #(0, 111, 172)
          pdf.roundedRect(MARGIN + summaryBoxPaddingX, netPayableBoxY, CONTENT_WIDTH - summaryBoxPaddingX * 2, 10, 2, 2, 'FD');
          
          // Net Payable content
          pdf.setTextColor(255, 255, 255); // White text
          pdf.setFontSize(FONT_SIZE_NORMAL);
          pdf.setFont("Helvetica", "bold");
          pdf.text("NET PAYABLE", MARGIN + summaryBoxPaddingX * 2, netPayableBoxY + 6);
          pdf.setFontSize(FONT_SIZE_NORMAL + 1);
          pdf.text(`PKR ${formatCurrencyForPdf(netPayable)}`, A4_WIDTH - MARGIN - summaryBoxPaddingX * 2, netPayableBoxY + 6, { align: 'right' });
          
          // Amount in Words Box
          const wordsBoxY = netPayableBoxY + 12;
          pdf.setFillColor(255, 255, 255); // White background
          pdf.setDrawColor(230, 230, 230); // Light gray border
          pdf.roundedRect(MARGIN + summaryBoxPaddingX, wordsBoxY, CONTENT_WIDTH - summaryBoxPaddingX * 2, 10, 2, 2, 'FD');
          
          // Amount in Words content
          pdf.setTextColor(40, 86, 182); // Blue text for label
          pdf.setFontSize(FONT_SIZE_SMALL);
          pdf.setFont("Helvetica", "bold");
          pdf.text("AMOUNT IN WORDS", MARGIN + summaryBoxPaddingX * 2, wordsBoxY + 4);
          
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);
          pdf.setFontSize(FONT_SIZE_NORMAL);
          pdf.setFont("Helvetica", "normal");
          pdf.text(netPayableInWords, MARGIN + summaryBoxPaddingX * 2, wordsBoxY + 8);
          
          // Update current Y position
          currentY = wordsBoxY + 12 + SECTION_SPACING * 1.5;
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]); 
          pdf.setFont("Helvetica", "normal"); 

          // 5. Payment Details
          const paymentDetailsTitleY = currentY + (LINE_HEIGHT_NORMAL / 2) - (FONT_SIZE_SECTION_HEADER / pdf.internal.scaleFactor / 2.5);
          pdf.setFontSize(FONT_SIZE_SECTION_HEADER);
          pdf.setFont("Helvetica", "bold");
          pdf.setTextColor(PRIMARY_BLUE_RGB[0], PRIMARY_BLUE_RGB[1], PRIMARY_BLUE_RGB[2]);
          pdf.text("Payment Details:", MARGIN, paymentDetailsTitleY);
          currentY += LINE_HEIGHT_NORMAL * 1.5;
          
          const paymentDetailsTextY = currentY + (LINE_HEIGHT_NORMAL / 2) - (FONT_SIZE_NORMAL / pdf.internal.scaleFactor / 2.5);
          pdf.setFontSize(FONT_SIZE_NORMAL);
          pdf.setFont("Helvetica", "normal");
          pdf.setTextColor(TEXT_COLOR_DARK_RGB[0], TEXT_COLOR_DARK_RGB[1], TEXT_COLOR_DARK_RGB[2]);
          pdf.text(paymentDetails, MARGIN, paymentDetailsTextY);
          currentY += LINE_HEIGHT_NORMAL + SECTION_SPACING;

          // 6. Footer
          // Ensure footer doesn't overlap if content is long, push it further down if needed
          const MIN_FOOTER_Y_FROM_BOTTOM = 15; // Minimum space from bottom of A4
          const A4_HEIGHT_APPROX = 297; // Approximate A4 height in mm
          const calculatedFooterY = A4_HEIGHT_APPROX - MIN_FOOTER_Y_FROM_BOTTOM - MARGIN;
          const footerY = Math.max(currentY, calculatedFooterY); 
          
          // Add horizontal line before footer
          pdf.setDrawColor(BORDER_COLOR_LIGHT_RGB[0], BORDER_COLOR_LIGHT_RGB[1], BORDER_COLOR_LIGHT_RGB[2]);
          pdf.setLineWidth(0.2);
          pdf.line(MARGIN, footerY - 6, A4_WIDTH - MARGIN, footerY - 6);

          pdf.setFontSize(FONT_SIZE_SMALL);
          pdf.setFont("Helvetica", "italic");
          pdf.setTextColor(TEXT_COLOR_MUTED_RGB[0], TEXT_COLOR_MUTED_RGB[1], TEXT_COLOR_MUTED_RGB[2]);
          const footerTextWidth = pdf.getStringUnitWidth(footerNote) * pdf.getFontSize() / pdf.internal.scaleFactor;
          pdf.text(footerNote, MARGIN + (CONTENT_WIDTH - footerTextWidth) / 2, footerY); 

          resolve(pdf.output('datauristring'));
        };

        processPdfContent().catch(err => {
          console.error('Error in PDF content processing:', err);
          reject(err);
        });

      } catch (error) {
        console.error('Error generating PDF with jsPDF API:', error);
        reject(error);
      }
    });
  };


  const handleGenerateSinglePayslip = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setProcessingEmployeeId(employeeId);
    updateEmployeeState(employeeId, { isGenerating: true, generationError: undefined, payslipPdfUri: undefined });

    try {
      const payslipInput: EmployeeDataForPayslip = {
        'Month': employee.Month,
        'Full Name': employee['Full Name'],
        'CNIC Number': employee['CNIC Number'],
        'Designation': employee.Designation,
        'Date Of Joining': employee['Date Of Joining'],
        'Gross Salary': employee['Gross Salary'],
        'Bonus / Commission': employee['Bonus / Commission'],
        'Increment': employee.Increment,
        'Reimbursment Amount': employee['Reimbursment Amount'],
        'Compensation': employee.Compensation,
        'Adjustments': employee.Adjustments,
        'Absents Deduction': employee['Absents Deduction'],
        'Lates Deduction': employee['Lates Deduction'],
        'Other Deductions': employee['Other Deductions'],
        'Payroll Tax Deduction': employee['Payroll Tax Deduction'],
      };

      const calculatedData = await generatePayslipData(payslipInput);
      const pdfDataUri = await generatePdfForEmployee(calculatedData);
      
      updateEmployeeState(employeeId, { payslipPdfUri: pdfDataUri, isGenerating: false, calculatedData: calculatedData });
      toast({
        title: "Payslip PDF Generated",
        description: `Successfully generated PDF payslip for ${employee['Full Name']}.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error) {
      console.error(`Error generating PDF payslip for ${employee['Full Name']}:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      updateEmployeeState(employeeId, { isGenerating: false, generationError: errorMessage });
      toast({
        title: "PDF Generation Failed",
        description: `Could not generate PDF payslip for ${employee['Full Name']}: ${errorMessage}`,
        variant: "destructive",
        action: <AlertCircle className="text-red-500" />,
      });
    } finally {
      setProcessingEmployeeId(null);
    }
  };

  const handleDownloadSinglePayslip = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && employee.payslipPdfUri) {
      downloadDataUri(employee.payslipPdfUri, `Payslip_${employee['Full Name'].replace(/\s/g, '_')}_${employee.Month}.pdf`);
      toast({
        title: "Download Started",
        description: `Downloading PDF payslip for ${employee['Full Name']}.`,
      });
    }
  };
  
  const handleGenerateAllPayslips = async () => {
    if (employees.length === 0) {
      toast({ title: "No Data", description: "Please upload employee data first.", variant: "destructive" });
      return;
    }
    
    setIsBatchProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    toast({
      title: "Batch PDF Generation Started",
      description: `Generating PDF payslips for ${employees.length} employees... This may take a while.`,
    });

    for (const employee of employees) {
      updateEmployeeState(employee.id, { isGenerating: true, generationError: undefined, payslipPdfUri: undefined }); 
      try {
        const payslipInput: EmployeeDataForPayslip = {
            'Month': employee.Month,
            'Full Name': employee['Full Name'],
            'CNIC Number': employee['CNIC Number'],
            'Designation': employee.Designation,
            'Date Of Joining': employee['Date Of Joining'],
            'Gross Salary': employee['Gross Salary'],
            'Bonus / Commission': employee['Bonus / Commission'],
            'Increment': employee.Increment,
            'Reimbursment Amount': employee['Reimbursment Amount'],
            'Compensation': employee.Compensation,
            'Adjustments': employee.Adjustments,
            'Absents Deduction': employee['Absents Deduction'],
            'Lates Deduction': employee['Lates Deduction'],
            'Other Deductions': employee['Other Deductions'],
            'Payroll Tax Deduction': employee['Payroll Tax Deduction'],
        };
        const calculatedData = await generatePayslipData(payslipInput);
        const pdfDataUri = await generatePdfForEmployee(calculatedData);
        updateEmployeeState(employee.id, { payslipPdfUri: pdfDataUri, isGenerating: false, calculatedData: calculatedData });
        successCount++;
      } catch (error) {
        console.error(`Error generating PDF payslip for ${employee['Full Name']}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        updateEmployeeState(employee.id, { isGenerating: false, generationError: errorMessage });
        errorCount++;
      }
    }
    setIsBatchProcessing(false);
    toast({
      title: "Batch PDF Generation Complete",
      description: `${successCount} PDF payslips generated. ${errorCount} failed.`,
      action: errorCount > 0 ? <AlertCircle className="text-yellow-500" /> : <CheckCircle className="text-green-500" />,
    });
  };

  const handleDownloadAllPayslips = async () => {
    const generatedPayslips = employees.filter(emp => emp.payslipPdfUri && !emp.generationError);
    if (generatedPayslips.length === 0) {
      toast({ title: "No PDF Payslips", description: "No PDF payslips have been generated successfully yet.", variant: "destructive" });
      return;
    }

    const filesToZip = generatedPayslips.map(emp => ({
      filename: `Payslip_${emp['Full Name'].replace(/\s/g, '_')}_${emp.Month}.pdf`,
      dataUri: emp.payslipPdfUri!,
    }));

    try {
      await downloadAllAsZip(filesToZip, 'All_Payslips.zip');
      toast({
        title: "Download Started",
        description: "Downloading all generated PDF payslips as a ZIP file.",
      });
    } catch (error) {
      console.error("Error zipping files:", error);
      toast({ title: "Zip Error", description: "Could not create ZIP file for download.", variant: "destructive" });
    }
  };

  const canDownloadAll = employees.some(emp => emp.payslipPdfUri && !emp.generationError);


  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center">
      <header className="w-full max-w-4xl mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary">PaySlip Generator</h1>
        <p className="text-muted-foreground mt-2">
          Easily generate and download employee payslips (PDF) from an Excel file.
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-8">
        <ExcelUploader onDataParsed={handleDataParsed} isLoading={isUploading} setIsLoading={setIsUploading} />
        
        {employees.length > 0 && (
          <Card className="shadow-lg">
             <CardHeader>
                <CardTitle className="font-headline text-2xl">Batch Actions</CardTitle>
                <CardDescription>Generate all payslips as PDF at once or download all generated PDF payslips.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGenerateAllPayslips} 
                disabled={isUploading || isBatchProcessing || !!processingEmployeeId || employees.length === 0}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isBatchProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FilePdf className="mr-2 h-4 w-4" />
                )}
                Generate All PDFs
              </Button>
              <Button 
                onClick={handleDownloadAllPayslips} 
                disabled={isUploading || isBatchProcessing || !canDownloadAll}
                variant="outline"
                className="w-full sm:w-auto text-primary border-primary hover:bg-primary/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All as ZIP
              </Button>
            </CardContent>
          </Card>
        )}

        <PayslipTable 
            employees={employees} 
            onGenerateSinglePayslip={handleGenerateSinglePayslip} 
            onDownloadSinglePayslip={handleDownloadSinglePayslip}
            processingEmployeeId={processingEmployeeId}
        />
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PaySlip Generator. Built with Next.js.</p>
      </footer>
    </div>
  );
}
    
