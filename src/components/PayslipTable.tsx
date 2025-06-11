
"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Eye, FileText as FilePdf, Loader2, AlertTriangle } from 'lucide-react'; // Changed FileImage to FilePdf
import type { EmployeeData } from '@/lib/excelParser';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, // Ensure this is imported
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface PayslipTableProps {
  employees: EmployeeData[];
  onGenerateSinglePayslip: (employeeId: string) => Promise<void>;
  onDownloadSinglePayslip: (employeeId: string) => void;
  processingEmployeeId: string | null;
}

const VISIBLE_COLUMNS: (keyof EmployeeData)[] = [
  'Full Name', 
  'Designation', 
  'Month',
  'Gross Salary',
];

export const PayslipTable: React.FC<PayslipTableProps> = ({ employees, onGenerateSinglePayslip, onDownloadSinglePayslip, processingEmployeeId }) => {
  if (employees.length === 0) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Employee Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">No data to display. Please upload an Excel file.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Employee Data Preview</CardTitle>
        <CardDescription>Review parsed data. Generate or download individual PDF payslips.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                {VISIBLE_COLUMNS.map(colKey => (
                  <TableHead key={String(colKey)} className="font-semibold">{String(colKey)}</TableHead>
                ))}
                <TableHead className="font-semibold text-center">Payslip PDF</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  {VISIBLE_COLUMNS.map(colKey => (
                    <TableCell key={`${employee.id}-${String(colKey)}`}>{String(employee[colKey])}</TableCell>
                  ))}
                  <TableCell className="text-center">
                    {employee.payslipPdfUri && !employee.generationError ? (
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm" className="flex items-center">
                            <Eye className="mr-2 h-4 w-4" /> View PDF
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-3xl min-h-[80vh]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-headline">Payslip PDF for {employee['Full Name']}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Preview of the generated PDF payslip. You can also download it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="my-4 h-[65vh] overflow-auto rounded-md border">
                            <embed 
                                src={employee.payslipPdfUri} 
                                type="application/pdf"
                                width="100%"
                                height="100%"
                                data-ai-hint="payslip document"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Close</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDownloadSinglePayslip(employee.id)} className="bg-primary hover:bg-primary/90">
                              <Download className="mr-2 h-4 w-4" /> Download PDF
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : employee.generationError ? (
                      <span className="text-destructive text-xs flex items-center justify-center">
                        <AlertTriangle className="mr-1 h-4 w-4"/> Error
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not generated</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {employee.payslipPdfUri && !employee.generationError ? (
                      <Button onClick={() => onDownloadSinglePayslip(employee.id)} size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/10">
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => onGenerateSinglePayslip(employee.id)} 
                        size="sm"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                        disabled={processingEmployeeId === employee.id || (!!processingEmployeeId && processingEmployeeId !== employee.id)}
                      >
                        {processingEmployeeId === employee.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FilePdf className="mr-2 h-4 w-4" />
                        )}
                        Generate PDF
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
