# Payslip Generator

A modern, professional payslip generation application built with Next.js and TypeScript. This application allows HR departments and business owners to quickly generate and download professional PDF payslips from employee data in Excel format.

![image](https://github.com/user-attachments/assets/a816ffaa-ead0-4d32-b3ff-2603dbe2329c)


## Features

- **Excel Data Import**: Upload employee payroll data via Excel files
- **Batch Processing**: Generate PDF payslips for all employees at once
- **Individual Processing**: Generate payslips for specific employees as needed
- **Professional PDF Layout**: Clean, modern payslip design with customizable sections
- **Downloadable PDFs**: Download individual PDFs or all payslips as a ZIP file
- **Responsive UI**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **PDF Generation**: jsPDF
- **Excel Parsing**: Custom Excel parser
- **State Management**: React Hooks
- **UI Components**: Shadcn UI components

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/MushafMughal/PAYSLIP-GENERATOR.git
cd PAYSLIP-GENERATOR
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:9002](http://localhost:9002) in your browser to see the application.

## Usage Guide

### Uploading Employee Data

![image](https://github.com/user-attachments/assets/2327940c-481a-4b08-998b-fb6373b964ae)


1. Prepare an Excel file with employee data in the required format
2. Click the "Upload Excel File" button and select your file
3. The application will parse the data and display it in a table


### Generating Payslips

#### Individual Payslips:
- Find the employee in the table
- Click the "Generate PDF" button for that employee
- Once generated, click "Download" to save the PDF

#### Batch Generation:
- After uploading employee data, click "Generate All PDFs"
- Wait for the process to complete
- Click "Download All as ZIP" to download all payslips

![image](https://github.com/user-attachments/assets/535b2221-8e91-46c6-acd1-5b5d1f67d54b)


### Payslip Customization

The payslip template includes:
- Employee and employer details
- Earnings breakdown
- Deductions breakdown
- Summary with total earnings, deductions, and net payable
- Payment details
- Company logo

![image](https://github.com/user-attachments/assets/29b777ec-698c-418c-91e8-dabe2efaab70)


## Excel Format Requirements

Your Excel file should contain the following columns:

- Month
- Full Name
- CNIC Number
- Designation
- Date Of Joining
- Gross Salary
- Bonus / Commission
- Increment
- Reimbursment Amount
- Compensation
- Adjustments
- Absents Deduction
- Lates Deduction
- Other Deductions
- Payroll Tax Deduction

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- UI Components by [Shadcn UI](https://ui.shadcn.com/)
- PDF Generation with [jsPDF](https://github.com/parallax/jsPDF)
