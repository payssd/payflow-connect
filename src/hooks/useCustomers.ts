import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Customer = Tables<'customers'>;
export type CustomerInsert = TablesInsert<'customers'>;
export type CustomerUpdate = TablesUpdate<'customers'>;

export function useCustomers() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!currentOrganization) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomer = async (customer: Omit<CustomerInsert, 'organization_id'>) => {
    if (!currentOrganization) return null;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, organization_id: currentOrganization.id })
        .select()
        .single();

      if (error) throw error;
      setCustomers((prev) => [data, ...prev]);
      toast({ title: 'Success', description: 'Customer added successfully' });
      return data;
    } catch (err: any) {
      console.error('Error creating customer:', err);
      toast({ title: 'Error', description: err.message || 'Failed to add customer', variant: 'destructive' });
      return null;
    }
  };

  const updateCustomer = async (id: string, updates: CustomerUpdate) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCustomers((prev) => prev.map((c) => (c.id === id ? data : c)));
      toast({ title: 'Success', description: 'Customer updated successfully' });
      return data;
    } catch (err: any) {
      console.error('Error updating customer:', err);
      toast({ title: 'Error', description: err.message || 'Failed to update customer', variant: 'destructive' });
      return null;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Success', description: 'Customer removed successfully' });
      return true;
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      toast({ title: 'Error', description: err.message || 'Failed to remove customer', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentOrganization?.id]);

  return { customers, isLoading, refetch: fetchCustomers, createCustomer, updateCustomer, deleteCustomer };
}
