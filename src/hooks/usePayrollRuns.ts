import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateTax } from '@/lib/kenyaTax';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { Employee } from './useEmployees';

export type PayrollRun = Tables<'payroll_runs'>;
export type PayrollRunInsert = TablesInsert<'payroll_runs'>;
export type PayrollItem = Tables<'payroll_items'>;
export type PayrollItemInsert = TablesInsert<'payroll_items'>;

export interface PayrollRunWithItems extends PayrollRun {
  items?: (PayrollItem & { employee?: Employee })[];
}

export function usePayrollRuns() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayrollRuns = async () => {
    if (!currentOrganization) {
      setPayrollRuns([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayrollRuns(data || []);
    } catch (err: any) {
      console.error('Error fetching payroll runs:', err);
      toast({ title: 'Error', description: 'Failed to load payroll runs', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRunNumber = async () => {
    if (!currentOrganization) return 'PR-0001';
    
    const { count } = await supabase
      .from('payroll_runs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', currentOrganization.id);
    
    const nextNum = (count || 0) + 1;
    return `PR-${String(nextNum).padStart(4, '0')}`;
  };

  const createPayrollRun = async (
    run: Omit<PayrollRunInsert, 'organization_id' | 'run_number'>,
    employees: Employee[]
  ) => {
    if (!currentOrganization) return null;

    try {
      const runNumber = await generateRunNumber();
      
      // Calculate payroll for each employee
      const payrollItems = employees
        .filter(emp => emp.status === 'active' && Number(emp.base_salary) > 0)
        .map(emp => {
          const grossPay = Number(emp.base_salary);
          const taxCalc = calculateTax(grossPay);
          
          return {
            employee_id: emp.id,
            basic_salary: grossPay,
            housing_allowance: 0,
            transport_allowance: 0,
            other_allowances: 0,
            gross_pay: grossPay,
            paye: taxCalc.paye,
            nhif: taxCalc.nhif,
            nssf: taxCalc.nssf,
            other_deductions: 0,
            total_deductions: taxCalc.totalDeductions,
            net_pay: taxCalc.netPay,
          };
        });

      // Calculate totals
      const totals = payrollItems.reduce(
        (acc, item) => ({
          gross: acc.gross + item.gross_pay,
          paye: acc.paye + item.paye,
          nhif: acc.nhif + item.nhif,
          nssf: acc.nssf + item.nssf,
          deductions: acc.deductions + item.total_deductions,
          net: acc.net + item.net_pay,
        }),
        { gross: 0, paye: 0, nhif: 0, nssf: 0, deductions: 0, net: 0 }
      );

      // Create payroll run
      const { data: runData, error: runError } = await supabase
        .from('payroll_runs')
        .insert({
          ...run,
          organization_id: currentOrganization.id,
          run_number: runNumber,
          total_gross: totals.gross,
          total_paye: totals.paye,
          total_nhif: totals.nhif,
          total_nssf: totals.nssf,
          total_deductions: totals.deductions,
          total_net: totals.net,
          employee_count: payrollItems.length,
        })
        .select()
        .single();

      if (runError) throw runError;

      // Insert payroll items
      if (payrollItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('payroll_items')
          .insert(payrollItems.map(item => ({ ...item, payroll_run_id: runData.id })));

        if (itemsError) throw itemsError;
      }

      setPayrollRuns(prev => [runData, ...prev]);
      toast({ title: 'Success', description: `Payroll run created with ${payrollItems.length} employees` });
      return runData;
    } catch (err: any) {
      console.error('Error creating payroll run:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create payroll run', variant: 'destructive' });
      return null;
    }
  };

  const updatePayrollRun = async (id: string, updates: TablesUpdate<'payroll_runs'>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setPayrollRuns(prev => prev.map(run => (run.id === id ? data : run)));
      toast({ title: 'Success', description: 'Payroll run updated' });
      return data;
    } catch (err: any) {
      console.error('Error updating payroll run:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const deletePayrollRun = async (id: string) => {
    try {
      const { error } = await supabase.from('payroll_runs').delete().eq('id', id);
      if (error) throw error;
      setPayrollRuns(prev => prev.filter(run => run.id !== id));
      toast({ title: 'Success', description: 'Payroll run deleted' });
      return true;
    } catch (err: any) {
      console.error('Error deleting payroll run:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const getPayrollRunWithItems = async (id: string): Promise<PayrollRunWithItems | null> => {
    try {
      const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .single();

      if (runError) throw runError;

      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', id);

      if (itemsError) throw itemsError;

      // Fetch employee details for each item
      const employeeIds = items?.map(item => item.employee_id) || [];
      const { data: employees } = await supabase
        .from('employees')
        .select('*')
        .in('id', employeeIds);

      const itemsWithEmployees = items?.map(item => ({
        ...item,
        employee: employees?.find(emp => emp.id === item.employee_id),
      }));

      return { ...run, items: itemsWithEmployees || [] };
    } catch (err: any) {
      console.error('Error fetching payroll run:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchPayrollRuns();
  }, [currentOrganization?.id]);

  return {
    payrollRuns,
    isLoading,
    refetch: fetchPayrollRuns,
    createPayrollRun,
    updatePayrollRun,
    deletePayrollRun,
    getPayrollRunWithItems,
    generateRunNumber,
  };
}
