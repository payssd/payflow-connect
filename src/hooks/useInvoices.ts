import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Invoice = Tables<'invoices'>;
export type InvoiceInsert = TablesInsert<'invoices'>;
export type InvoiceUpdate = TablesUpdate<'invoices'>;
export type InvoiceItem = Tables<'invoice_items'>;
export type InvoiceItemInsert = TablesInsert<'invoice_items'>;

export interface InvoiceWithItems extends Invoice {
  items?: InvoiceItem[];
}

export function useInvoices() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    if (!currentOrganization) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoiceNumber = async () => {
    if (!currentOrganization) return 'INV-0001';
    
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrganization.id);
    
    const nextNum = (count || 0) + 1;
    return `INV-${String(nextNum).padStart(4, '0')}`;
  };

  const createInvoice = async (
    invoice: Omit<InvoiceInsert, 'organization_id' | 'invoice_number'>,
    items: Omit<InvoiceItemInsert, 'invoice_id'>[]
  ) => {
    if (!currentOrganization) return null;

    try {
      const invoiceNumber = await generateInvoiceNumber();
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const taxAmount = subtotal * (Number(invoice.tax_rate || 16) / 100);
      const total = subtotal + taxAmount - Number(invoice.discount_amount || 0);

      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          organization_id: currentOrganization.id,
          invoice_number: invoiceNumber,
          subtotal,
          tax_amount: taxAmount,
          total,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items.map((item) => ({ ...item, invoice_id: invoiceData.id })));

        if (itemsError) throw itemsError;
      }

      setInvoices((prev) => [invoiceData, ...prev]);
      toast({ title: 'Success', description: 'Invoice created successfully' });
      return invoiceData;
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create invoice', variant: 'destructive' });
      return null;
    }
  };

  const updateInvoice = async (id: string, updates: InvoiceUpdate) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? data : inv)));
      toast({ title: 'Success', description: 'Invoice updated successfully' });
      return data;
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update invoice', variant: 'destructive' });
      return null;
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast({ title: 'Success', description: 'Invoice deleted successfully' });
      return true;
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      toast({ title: 'Error', description: err.message || 'Failed to delete invoice', variant: 'destructive' });
      return false;
    }
  };

  const getInvoiceWithItems = async (id: string): Promise<InvoiceWithItems | null> => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      return { ...invoice, items: items || [] };
    } catch (err: any) {
      console.error('Error fetching invoice:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentOrganization?.id]);

  return {
    invoices,
    isLoading,
    refetch: fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceWithItems,
    generateInvoiceNumber,
  };
}
