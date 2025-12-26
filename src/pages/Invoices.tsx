import { useState } from 'react';
import { InvoiceList } from '@/components/invoices/InvoiceList';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { useInvoices, type Invoice } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { downloadInvoicePdf } from '@/lib/invoicePdf';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Invoices() {
  const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice, getInvoiceWithItems, refetch } = useInvoices();
  const { customers } = useCustomers();
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsFormOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    // For now, just log - could open a detail view modal
    console.log('View invoice:', invoice);
  };

  const handleSubmit = async (invoiceData: any, items: any[]) => {
    setIsSubmitting(true);
    try {
      return await createInvoice(invoiceData, items);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    return await updateInvoice(id, { status: status as any });
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (!currentOrganization) return;
    const fullInvoice = await getInvoiceWithItems(invoice.id);
    if (fullInvoice) {
      downloadInvoicePdf(fullInvoice, {
        name: currentOrganization.name,
        email: currentOrganization.email,
        phone: currentOrganization.phone,
        country: currentOrganization.country,
      });
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (!currentOrganization || !invoice.customer_email) {
      toast({ title: 'Error', description: 'Customer email is required to send invoice', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: invoice.customer_email,
          recipientName: invoice.customer_name || 'Customer',
          senderName: currentOrganization.name,
          senderEmail: currentOrganization.email,
        },
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Invoice sent to ${invoice.customer_email}` });
      refetch(); // Refresh to show updated status
    } catch (err: any) {
      console.error('Error sending invoice email:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to send invoice email', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">Create and manage invoices for your customers.</p>
      </div>

      <InvoiceList
        invoices={invoices}
        isLoading={isLoading}
        onAddNew={handleAddNew}
        onView={handleView}
        onDelete={deleteInvoice}
        onUpdateStatus={handleUpdateStatus}
        onDownloadPdf={handleDownloadPdf}
        onSendEmail={handleSendEmail}
      />

      <InvoiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customers={customers}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
