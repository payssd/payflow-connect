import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { InvoiceWithItems } from '@/hooks/useInvoices';

interface Organization {
  name: string;
  email: string;
  phone?: string | null;
  country: string;
}

export function generateInvoicePdf(invoice: InvoiceWithItems, organization: Organization) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const formatCurrency = (amount: number | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Header - Company Info
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(organization.name, margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(organization.email, margin, y);
  y += 5;
  if (organization.phone) {
    doc.text(organization.phone, margin, y);
    y += 5;
  }
  doc.text(organization.country, margin, y);

  // Invoice Title
  y = margin;
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(invoice.invoice_number, pageWidth - margin, y, { align: 'right' });

  // Invoice Details Box
  y = 55;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F');

  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Issue Date', margin + 10, y);
  doc.text('Due Date', margin + 60, y);
  doc.text('Status', margin + 110, y);

  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(format(new Date(invoice.issue_date), 'MMM d, yyyy'), margin + 10, y);
  doc.text(format(new Date(invoice.due_date), 'MMM d, yyyy'), margin + 60, y);
  doc.text((invoice.status || 'draft').toUpperCase(), margin + 110, y);

  // Bill To Section
  y = 105;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100);
  doc.text('BILL TO', margin, y);

  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(invoice.customer_name || 'Customer', margin, y);

  if (invoice.customer_email) {
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(invoice.customer_email, margin, y);
  }

  if (invoice.customer_address) {
    y += 5;
    doc.text(invoice.customer_address, margin, y);
  }

  // Line Items Table
  y = 145;
  const colWidths = [80, 25, 35, 35];
  const tableWidth = pageWidth - 2 * margin;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, tableWidth, 10, 2, 2, 'F');
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100);
  doc.text('Description', margin + 5, y);
  doc.text('Qty', margin + colWidths[0], y);
  doc.text('Unit Price', margin + colWidths[0] + colWidths[1], y);
  doc.text('Amount', margin + colWidths[0] + colWidths[1] + colWidths[2] + 15, y, { align: 'right' });

  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);

  const items = invoice.items || [];
  items.forEach((item) => {
    doc.setFontSize(10);
    doc.text(item.description, margin + 5, y);
    doc.text(String(item.quantity), margin + colWidths[0], y);
    doc.text(formatCurrency(Number(item.unit_price)), margin + colWidths[0] + colWidths[1], y);
    doc.text(formatCurrency(Number(item.amount)), margin + colWidths[0] + colWidths[1] + colWidths[2] + 15, y, { align: 'right' });

    y += 8;

    // Draw separator line
    doc.setDrawColor(230);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  });

  // Totals Section
  y += 10;
  const totalsX = pageWidth - margin - 70;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(0);
  doc.text(formatCurrency(Number(invoice.subtotal)), pageWidth - margin, y, { align: 'right' });

  if (invoice.tax_rate && Number(invoice.tax_rate) > 0) {
    y += 7;
    doc.setTextColor(100);
    doc.text(`Tax (${invoice.tax_rate}%)`, totalsX, y);
    doc.setTextColor(0);
    doc.text(formatCurrency(Number(invoice.tax_amount)), pageWidth - margin, y, { align: 'right' });
  }

  if (invoice.discount_amount && Number(invoice.discount_amount) > 0) {
    y += 7;
    doc.setTextColor(100);
    doc.text('Discount', totalsX, y);
    doc.setTextColor(0);
    doc.text(`-${formatCurrency(Number(invoice.discount_amount))}`, pageWidth - margin, y, { align: 'right' });
  }

  // Total
  y += 12;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(totalsX - 10, y - 6, pageWidth - margin - totalsX + 10, 14, 2, 2, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', totalsX, y + 3);
  doc.text(formatCurrency(Number(invoice.total)), pageWidth - margin, y + 3, { align: 'right' });

  // Notes Section
  if (invoice.notes) {
    y += 30;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('NOTES', margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  // Terms Section
  if (invoice.terms) {
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text('TERMS & CONDITIONS', margin, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin);
    doc.text(lines, margin, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

export function downloadInvoicePdf(invoice: InvoiceWithItems, organization: Organization) {
  const doc = generateInvoicePdf(invoice, organization);
  doc.save(`${invoice.invoice_number}.pdf`);
}
