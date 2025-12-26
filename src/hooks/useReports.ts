import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface MonthlyData {
  month: string;
  revenue: number;
  invoiceCount: number;
}

interface PayrollMonthlyData {
  month: string;
  grossPay: number;
  netPay: number;
  deductions: number;
}

interface InvoiceStatusData {
  status: string;
  count: number;
  amount: number;
}

export function useReports() {
  const { currentOrganization } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentOrganization) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [invoicesRes, payrollRes] = await Promise.all([
          supabase
            .from('invoices')
            .select('*')
            .eq('organization_id', currentOrganization.id),
          supabase
            .from('payroll_runs')
            .select('*')
            .eq('organization_id', currentOrganization.id),
        ]);

        setInvoices(invoicesRes.data || []);
        setPayrollRuns(payrollRes.data || []);
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentOrganization?.id]);

  const summaryStats = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    const outstandingAmount = invoices
      .filter((inv) => ['sent', 'partial', 'overdue'].includes(inv.status))
      .reduce((sum, inv) => sum + Number(inv.total || 0) - Number(inv.amount_paid || 0), 0);

    const totalPayroll = payrollRuns
      .filter((run) => run.status === 'completed')
      .reduce((sum, run) => sum + Number(run.total_net || 0), 0);

    const totalEmployeesPaid = payrollRuns
      .filter((run) => run.status === 'completed')
      .reduce((sum, run) => sum + Number(run.employee_count || 0), 0);

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter((inv) => ['draft', 'sent'].includes(inv.status)).length;

    return {
      totalRevenue,
      outstandingAmount,
      totalPayroll,
      totalEmployeesPaid,
      totalInvoices: invoices.length,
      paidInvoices,
      pendingInvoices,
      completedPayrollRuns: payrollRuns.filter((r) => r.status === 'completed').length,
    };
  }, [invoices, payrollRuns]);

  const monthlyRevenue = useMemo((): MonthlyData[] => {
    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthInvoices = invoices.filter((inv) => {
        const invDate = new Date(inv.issue_date);
        return invDate >= start && invDate <= end;
      });

      months.push({
        month: format(date, 'MMM'),
        revenue: monthInvoices
          .filter((inv) => inv.status === 'paid')
          .reduce((sum, inv) => sum + Number(inv.total || 0), 0),
        invoiceCount: monthInvoices.length,
      });
    }
    return months;
  }, [invoices]);

  const monthlyPayroll = useMemo((): PayrollMonthlyData[] => {
    const months: PayrollMonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthRuns = payrollRuns.filter((run) => {
        const runDate = new Date(run.payment_date);
        return runDate >= start && runDate <= end && run.status === 'completed';
      });

      months.push({
        month: format(date, 'MMM'),
        grossPay: monthRuns.reduce((sum, run) => sum + Number(run.total_gross || 0), 0),
        netPay: monthRuns.reduce((sum, run) => sum + Number(run.total_net || 0), 0),
        deductions: monthRuns.reduce((sum, run) => sum + Number(run.total_deductions || 0), 0),
      });
    }
    return months;
  }, [payrollRuns]);

  const invoicesByStatus = useMemo((): InvoiceStatusData[] => {
    const statusMap: Record<string, { count: number; amount: number }> = {};

    invoices.forEach((inv) => {
      const status = inv.status || 'draft';
      if (!statusMap[status]) {
        statusMap[status] = { count: 0, amount: 0 };
      }
      statusMap[status].count += 1;
      statusMap[status].amount += Number(inv.total || 0);
    });

    return Object.entries(statusMap).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      ...data,
    }));
  }, [invoices]);

  return {
    isLoading,
    summaryStats,
    monthlyRevenue,
    monthlyPayroll,
    invoicesByStatus,
  };
}
