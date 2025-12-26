import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export function useDashboardStats() {
  const { currentOrganization } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return {
          employeeCount: 0,
          pendingInvoicesCount: 0,
          pendingInvoicesAmount: 0,
          thisMonthPayroll: 0,
          paidRevenueThisMonth: 0,
          employeeChange: 0,
          payrollChange: 0,
          revenueChange: 0,
          recentActivity: [],
          expensesByCategory: [],
          monthlyRevenue: [],
        };
      }

      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, status, created_at')
        .eq('organization_id', currentOrganization.id);

      const activeEmployees = employees?.filter(e => e.status === 'active') || [];
      const employeeCount = activeEmployees.length;

      // Fetch pending invoices
      const { data: pendingInvoices } = await supabase
        .from('invoices')
        .select('id, total, status')
        .eq('organization_id', currentOrganization.id)
        .in('status', ['sent', 'overdue']);

      const pendingInvoicesCount = pendingInvoices?.length || 0;
      const pendingInvoicesAmount = pendingInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

      // Fetch this month's payroll
      const { data: thisMonthRuns } = await supabase
        .from('payroll_runs')
        .select('id, total_net, status')
        .eq('organization_id', currentOrganization.id)
        .gte('payment_date', format(thisMonthStart, 'yyyy-MM-dd'))
        .lte('payment_date', format(thisMonthEnd, 'yyyy-MM-dd'));

      const thisMonthPayroll = thisMonthRuns?.reduce((sum, run) => sum + Number(run.total_net || 0), 0) || 0;

      // Fetch last month's payroll for comparison
      const { data: lastMonthRuns } = await supabase
        .from('payroll_runs')
        .select('id, total_net')
        .eq('organization_id', currentOrganization.id)
        .gte('payment_date', format(lastMonthStart, 'yyyy-MM-dd'))
        .lte('payment_date', format(lastMonthEnd, 'yyyy-MM-dd'));

      const lastMonthPayroll = lastMonthRuns?.reduce((sum, run) => sum + Number(run.total_net || 0), 0) || 0;
      const payrollChange = lastMonthPayroll > 0 ? ((thisMonthPayroll - lastMonthPayroll) / lastMonthPayroll) * 100 : 0;

      // Fetch paid invoices this month
      const { data: paidInvoicesThisMonth } = await supabase
        .from('invoices')
        .select('id, total, amount_paid')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('updated_at', thisMonthStart.toISOString())
        .lte('updated_at', thisMonthEnd.toISOString());

      const paidRevenueThisMonth = paidInvoicesThisMonth?.reduce((sum, inv) => sum + Number(inv.amount_paid || inv.total), 0) || 0;

      // Fetch paid invoices last month for comparison
      const { data: paidInvoicesLastMonth } = await supabase
        .from('invoices')
        .select('id, total, amount_paid')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('updated_at', lastMonthStart.toISOString())
        .lte('updated_at', lastMonthEnd.toISOString());

      const paidRevenueLastMonth = paidInvoicesLastMonth?.reduce((sum, inv) => sum + Number(inv.amount_paid || inv.total), 0) || 0;
      const revenueChange = paidRevenueLastMonth > 0 ? ((paidRevenueThisMonth - paidRevenueLastMonth) / paidRevenueLastMonth) * 100 : 0;

      // Fetch expenses by category (for chart)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('organization_id', currentOrganization.id)
        .gte('expense_date', format(thisMonthStart, 'yyyy-MM-dd'))
        .lte('expense_date', format(thisMonthEnd, 'yyyy-MM-dd'));

      const expensesByCategory: { name: string; value: number }[] = [];
      expenses?.forEach(expense => {
        const existing = expensesByCategory.find(e => e.name === expense.category);
        if (existing) {
          existing.value += Number(expense.amount);
        } else {
          expensesByCategory.push({ name: expense.category, value: Number(expense.amount) });
        }
      });

      // Get monthly revenue for last 6 months (for chart)
      const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        
        const { data: monthInvoices } = await supabase
          .from('invoices')
          .select('amount_paid, total')
          .eq('organization_id', currentOrganization.id)
          .eq('status', 'paid')
          .gte('updated_at', monthStart.toISOString())
          .lte('updated_at', monthEnd.toISOString());

        const { data: monthExpenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('organization_id', currentOrganization.id)
          .gte('expense_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('expense_date', format(monthEnd, 'yyyy-MM-dd'));

        const revenue = monthInvoices?.reduce((sum, inv) => sum + Number(inv.amount_paid || inv.total), 0) || 0;
        const expenseTotal = monthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

        monthlyRevenue.push({
          month: format(monthStart, 'MMM'),
          revenue,
          expenses: expenseTotal,
        });
      }

      // Recent activity
      const recentActivity: { title: string; description: string; time: string; status: 'success' | 'warning' | 'info' }[] = [];

      // Recent invoices
      const { data: recentInvoices } = await supabase
        .from('invoices')
        .select('invoice_number, customer_name, total, status, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(3);

      recentInvoices?.forEach(inv => {
        recentActivity.push({
          title: `Invoice ${inv.invoice_number}`,
          description: `${inv.customer_name || 'Customer'} - KES ${Number(inv.total).toLocaleString()}`,
          time: format(new Date(inv.created_at), 'MMM d, h:mm a'),
          status: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'warning' : 'info',
        });
      });

      // Recent payroll runs
      const { data: recentPayroll } = await supabase
        .from('payroll_runs')
        .select('name, total_net, status, created_at')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(2);

      recentPayroll?.forEach(run => {
        recentActivity.push({
          title: run.name,
          description: `Net Pay: KES ${Number(run.total_net || 0).toLocaleString()}`,
          time: format(new Date(run.created_at), 'MMM d, h:mm a'),
          status: run.status === 'completed' ? 'success' : 'info',
        });
      });

      // Sort by time
      recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      return {
        employeeCount,
        pendingInvoicesCount,
        pendingInvoicesAmount,
        thisMonthPayroll,
        paidRevenueThisMonth,
        employeeChange: 0,
        payrollChange: Math.round(payrollChange),
        revenueChange: Math.round(revenueChange),
        recentActivity: recentActivity.slice(0, 5),
        expensesByCategory,
        monthlyRevenue,
      };
    },
    enabled: !!currentOrganization,
  });
}
