import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Employee = Tables<'employees'>;
export type EmployeeInsert = TablesInsert<'employees'>;
export type EmployeeUpdate = TablesUpdate<'employees'>;

export function useEmployees() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    if (!currentOrganization) {
      setEmployees([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createEmployee = async (employee: Omit<EmployeeInsert, 'organization_id'>) => {
    if (!currentOrganization) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('employees')
        .insert({
          ...employee,
          organization_id: currentOrganization.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEmployees((prev) => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Employee added successfully',
      });
      return data;
    } catch (err: any) {
      console.error('Error creating employee:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add employee',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateEmployee = async (id: string, updates: EmployeeUpdate) => {
    try {
      const { data, error: updateError } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? data : emp))
      );
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
      return data;
    } catch (err: any) {
      console.error('Error updating employee:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update employee',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast({
        title: 'Success',
        description: 'Employee removed successfully',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove employee',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentOrganization?.id]);

  return {
    employees,
    isLoading,
    error,
    refetch: fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
