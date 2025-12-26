import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface Organization {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  country: string;
}

interface Employee {
  first_name: string;
  last_name: string;
  employee_number?: string | null;
  job_title?: string | null;
  department?: string | null;
  kra_pin?: string | null;
  nhif_number?: string | null;
  nssf_number?: string | null;
}

interface PayrollRun {
  run_number: string;
  name: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
}

interface PayrollItem {
  basic_salary: number;
  housing_allowance?: number | null;
  transport_allowance?: number | null;
  other_allowances?: number | null;
  gross_pay: number;
  paye?: number | null;
  nhif?: number | null;
  nssf?: number | null;
  housing_levy?: number | null;
  other_deductions?: number | null;
  total_deductions?: number | null;
  net_pay: number;
}

export function generatePayslipPdf(
  organization: Organization,
  employee: Employee,
  payrollRun: PayrollRun,
  payrollItem: PayrollItem
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const formatCurrency = (amount: number | null | undefined): string => {
    const value = Number(amount) || 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  let yPos = margin;

  // Header - Company Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(organization.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Company details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const companyDetails = [organization.email, organization.phone, organization.address]
    .filter(Boolean)
    .join(' • ');
  doc.text(companyDetails, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Payslip Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Pay Period
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  const periodText = `${format(new Date(payrollRun.pay_period_start), 'MMM d')} - ${format(new Date(payrollRun.pay_period_end), 'MMM d, yyyy')}`;
  doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Divider line
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Employee Information Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Employee Information', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const employeeInfo = [
    ['Name', `${employee.first_name} ${employee.last_name}`],
    ['Employee No.', employee.employee_number || '-'],
    ['Position', employee.job_title || '-'],
    ['Department', employee.department || '-'],
    ['KRA PIN', employee.kra_pin || '-'],
  ];

  const colWidth = contentWidth / 2;
  employeeInfo.forEach(([label, value], index) => {
    const xPos = index % 2 === 0 ? margin : margin + colWidth;
    if (index % 2 === 0 && index > 0) yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${label}:`, xPos, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(String(value), xPos + 30, yPos);
  });
  yPos += 15;

  // Earnings Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Earnings', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  const earnings = [
    ['Basic Salary', payrollItem.basic_salary],
    ['Housing Allowance', payrollItem.housing_allowance || 0],
    ['Transport Allowance', payrollItem.transport_allowance || 0],
    ['Other Allowances', payrollItem.other_allowances || 0],
  ];

  earnings.forEach(([label, amount]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(String(label), margin, yPos);
    doc.text(formatCurrency(Number(amount)), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  });

  // Gross Pay
  yPos += 2;
  doc.setDrawColor(220);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Gross Pay', margin, yPos);
  doc.text(formatCurrency(payrollItem.gross_pay), pageWidth - margin, yPos, { align: 'right' });
  yPos += 15;

  // Deductions Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Statutory Deductions', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  const deductions = [
    ['PAYE (Income Tax)', payrollItem.paye || 0],
    ['NHIF (Health Insurance)', payrollItem.nhif || 0],
    ['NSSF (Pension)', payrollItem.nssf || 0],
    ['Housing Levy', payrollItem.housing_levy || 0],
    ['Other Deductions', payrollItem.other_deductions || 0],
  ];

  deductions.forEach(([label, amount]) => {
    if (Number(amount) > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(String(label), margin, yPos);
      doc.setTextColor(180, 50, 50);
      doc.text(`(${formatCurrency(Number(amount))})`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }
  });

  // Total Deductions
  const totalDeductions = Number(payrollItem.total_deductions) || 
    (Number(payrollItem.paye) || 0) + 
    (Number(payrollItem.nhif) || 0) + 
    (Number(payrollItem.nssf) || 0) + 
    (Number(payrollItem.housing_levy) || 0) + 
    (Number(payrollItem.other_deductions) || 0);

  yPos += 2;
  doc.setDrawColor(220);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 50, 50);
  doc.text('Total Deductions', margin, yPos);
  doc.text(`(${formatCurrency(totalDeductions)})`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 15;

  // Net Pay Box
  doc.setFillColor(240, 247, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'FD');

  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Net Pay', margin + 10, yPos);
  doc.setFontSize(14);
  doc.setTextColor(34, 87, 153);
  doc.text(formatCurrency(payrollItem.net_pay), pageWidth - margin - 10, yPos, { align: 'right' });
  yPos += 8;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Amount payable to employee', margin + 10, yPos);
  yPos += 20;

  // Statutory Numbers
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.setFont('helvetica', 'normal');
  const statutoryInfo = [
    employee.nhif_number ? `NHIF No: ${employee.nhif_number}` : null,
    employee.nssf_number ? `NSSF No: ${employee.nssf_number}` : null,
  ].filter(Boolean).join('  •  ');
  
  if (statutoryInfo) {
    doc.text(statutoryInfo, margin, yPos);
    yPos += 10;
  }

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 25;
  doc.setDrawColor(200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy')} • ${payrollRun.run_number}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

export function downloadPayslipPdf(
  organization: Organization,
  employee: Employee,
  payrollRun: PayrollRun,
  payrollItem: PayrollItem
): void {
  const doc = generatePayslipPdf(organization, employee, payrollRun, payrollItem);
  const fileName = `Payslip_${employee.first_name}_${employee.last_name}_${format(new Date(payrollRun.pay_period_end), 'MMM_yyyy')}.pdf`;
  doc.save(fileName);
}
