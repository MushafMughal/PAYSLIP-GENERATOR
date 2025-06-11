"use client";

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import type { EmployeeData } from '@/lib/excelParser';
import { parseExcel } from '@/lib/excelParser';
import { useToast } from "@/hooks/use-toast";

interface ExcelUploaderProps {
  onDataParsed: (data: EmployeeData[]) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataParsed, isLoading, setIsLoading }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setFileName(file.name);
      try {
        const data = await parseExcel(file);
        onDataParsed(data);
        toast({
          title: "Excel File Processed",
          description: `${data.length} records found in "${file.name}".`,
        });
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        let errorMessage = "Failed to parse Excel file.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        toast({
          title: "Error Parsing File",
          description: errorMessage,
          variant: "destructive",
        });
        onDataParsed([]); // Clear any existing data
      } finally {
        setIsLoading(false);
        // Reset file input to allow re-upload of the same file
        event.target.value = ''; 
      }
    } else {
      setFileName(null);
      onDataParsed([]);
    }
  }, [onDataParsed, setIsLoading, toast]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          Upload Employee Data
        </CardTitle>
        <CardDescription>
          Upload an Excel file (.xlsx, .xls) with employee details. Ensure columns match:
          Month, Full Name, CNIC Number, Designation, Date Of Joining, Gross Salary, Bonus / Commission, Increment, Reimbursment Amount, Compensation, Adjustments, Absents Deduction, Lates Deduction, Other Deductions, Payroll Tax Deduction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="excel-file" className="sr-only">Upload Excel File</Label>
          <Input 
            id="excel-file" 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange} 
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            disabled={isLoading}
          />
        </div>
        {isLoading && (
          <div className="mt-4 flex items-center text-primary">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm">Processing file, please wait...</span>
          </div>
        )}
        {fileName && !isLoading && (
          <div className="mt-4 flex items-center text-muted-foreground">
            <FileText className="mr-2 h-5 w-5" />
            <span className="text-sm">Uploaded: {fileName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
