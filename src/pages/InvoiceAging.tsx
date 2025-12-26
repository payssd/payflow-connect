import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2, Download, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';

interface AgingInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  amount_paid: number;
  due_date: string;
  issue_date: string;
  status: string;
  days_overdue: number;
  balance_due: number;
}

interface AgingSummary {
  current: { count: number; amount: number };
  days1_30: { count: number; amount: number };
  days31_60: { count: number; amount: number };
  days61_90: { count: number; amount: number };
  days90Plus: { count: number; amount: number };
  total: { count: number; amount: number };
}

export default function InvoiceAging() {
  const { currentOrganization } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<AgingInvoice[]>([]);
  const [summary, setSummary] = useState<AgingSummary>({
    current: { count: 0, amount: 0 },
    days1_30: { count: 0, amount: 0 },
    days31_60: { count: 0, amount: 0 },
    days61_90: { count: 0, amount: 0 },
    days90Plus: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 },
  });

  useEffect(() => {
    if (currentOrganization) {
      fetchAgingData();
    }
  }, [currentOrganization]);

  const fetchAgingData = async () => {
    if (!currentOrganization) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .in('status', ['sent', 'overdue', 'partially_paid'])
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching invoices:', error);
      setIsLoading(false);
      return;
    }

    const today = new Date();
    const processedInvoices: AgingInvoice[] = (data || []).map((inv) => {
      const dueDate = parseISO(inv.due_date);
      const daysOverdue = differenceInDays(today, dueDate);
      const balanceDue = inv.total - (inv.amount_paid || 0);
      
      return {
        ...inv,
        days_overdue: daysOverdue,
        balance_due: balanceDue,
      };
    });

    // Calculate summary
    const newSummary: AgingSummary = {
      current: { count: 0, amount: 0 },
      days1_30: { count: 0, amount: 0 },
      days31_60: { count: 0, amount: 0 },
      days61_90: { count: 0, amount: 0 },
      days90Plus: { count: 0, amount: 0 },
      total: { count: 0, amount: 0 },
    };

    processedInvoices.forEach((inv) => {
      newSummary.total.count++;
      newSummary.total.amount += inv.balance_due;

      if (inv.days_overdue <= 0) {
        newSummary.current.count++;
        newSummary.current.amount += inv.balance_due;
      } else if (inv.days_overdue <= 30) {
        newSummary.days1_30.count++;
        newSummary.days1_30.amount += inv.balance_due;
      } else if (inv.days_overdue <= 60) {
        newSummary.days31_60.count++;
        newSummary.days31_60.amount += inv.balance_due;
      } else if (inv.days_overdue <= 90) {
        newSummary.days61_90.count++;
        newSummary.days61_90.amount += inv.balance_due;
      } else {
        newSummary.days90Plus.count++;
        newSummary.days90Plus.amount += inv.balance_due;
      }
    });

    setInvoices(processedInvoices);
    setSummary(newSummary);
    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAgingBadge = (daysOverdue: number) => {
    if (daysOverdue <= 0) {
      return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Current</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">1-30 days</Badge>;
    } else if (daysOverdue <= 60) {
      return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">31-60 days</Badge>;
    } else if (daysOverdue <= 90) {
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">61-90 days</Badge>;
    } else {
      return <Badge variant="destructive">90+ days</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 page-transition">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Aging</h1>
          <p className="text-muted-foreground">Track outstanding invoices by age.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-0 shadow-card">
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Current', data: summary.current, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
    { label: '1-30 Days', data: summary.days1_30, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
    { label: '31-60 Days', data: summary.days31_60, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: '61-90 Days', data: summary.days61_90, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: '90+ Days', data: summary.days90Plus, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Aging</h1>
          <p className="text-muted-foreground">Track outstanding invoices by age.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(card.data.amount)}</p>
              <p className="text-xs text-muted-foreground">{card.data.count} invoice{card.data.count !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Outstanding */}
      <Card className="border-0 shadow-card bg-gradient-to-r from-primary/10 to-info/10">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
              <p className="text-3xl font-bold">{formatCurrency(summary.total.amount)}</p>
              <p className="text-sm text-muted-foreground">{summary.total.count} unpaid invoices</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle>Outstanding Invoices</CardTitle>
          <CardDescription>All unpaid and overdue invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All caught up!</h3>
              <p className="text-muted-foreground">No outstanding invoices at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Balance Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link to={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{invoice.customer_name}</p>
                          {invoice.customer_email && (
                            <p className="text-xs text-muted-foreground">{invoice.customer_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.balance_due)}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.due_date).toLocaleDateString('en-KE', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{getAgingBadge(invoice.days_overdue)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
