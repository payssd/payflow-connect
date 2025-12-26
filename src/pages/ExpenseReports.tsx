import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { Loader2, FileDown, Receipt, Calendar, TrendingDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  vendor: string | null;
  expense_date: string;
  status: string;
  created_at: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#f97316', '#14b8a6', '#ef4444', '#06b6d4'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function ExpenseReports() {
  const { currentOrganization } = useAuth();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expense-reports', currentOrganization?.id, startDate, endDate],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!currentOrganization,
  });

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [expenses, statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    if (!expenses) return [];
    return [...new Set(expenses.map(e => e.category))];
  }, [expenses]);

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const approved = filteredExpenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + Number(e.amount), 0);
    const pending = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + Number(e.amount), 0);
    const rejected = filteredExpenses.filter(e => e.status === 'rejected').reduce((sum, e) => sum + Number(e.amount), 0);
    return { total, approved, pending, rejected, count: filteredExpenses.length };
  }, [filteredExpenses]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      grouped[e.category] = (grouped[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const statusData = useMemo(() => {
    const counts = { approved: 0, pending: 0, rejected: 0 };
    filteredExpenses.forEach(e => {
      if (e.status in counts) {
        counts[e.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Approved', value: counts.approved, color: '#22c55e' },
      { name: 'Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'Rejected', value: counts.rejected, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [filteredExpenses]);

  const setPresetRange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'this-month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
      case 'last-3-months':
        setStartDate(format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'last-6-months':
        setStartDate(format(startOfMonth(subMonths(today, 5)), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.text('Expense Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(currentOrganization?.name || 'Organization', pageWidth / 2, 28, { align: 'center' });
      doc.text(`Period: ${format(parseISO(startDate), 'MMM d, yyyy')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`, pageWidth / 2, 34, { align: 'center' });
      doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, pageWidth / 2, 40, { align: 'center' });
      
      // Summary
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text('Summary', 14, 55);
      
      doc.setFontSize(10);
      let y = 65;
      doc.text(`Total Expenses: ${formatCurrency(stats.total)}`, 14, y);
      doc.text(`Approved: ${formatCurrency(stats.approved)}`, 14, y + 6);
      doc.text(`Pending: ${formatCurrency(stats.pending)}`, 14, y + 12);
      doc.text(`Rejected: ${formatCurrency(stats.rejected)}`, 14, y + 18);
      doc.text(`Number of Expenses: ${stats.count}`, 14, y + 24);
      
      // Category breakdown
      doc.setFontSize(14);
      doc.text('By Category', 14, y + 40);
      
      doc.setFontSize(9);
      let catY = y + 50;
      categoryData.slice(0, 10).forEach((cat) => {
        doc.text(`${cat.name}: ${formatCurrency(cat.value)}`, 14, catY);
        catY += 6;
      });
      
      // Expense table
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Expense Details', 14, 20);
      
      doc.setFontSize(8);
      const headers = ['Date', 'Description', 'Category', 'Status', 'Amount'];
      const colWidths = [25, 60, 40, 25, 30];
      let tableY = 30;
      
      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(14, tableY - 4, pageWidth - 28, 8, 'F');
      doc.setTextColor(0);
      let x = 14;
      headers.forEach((header, i) => {
        doc.text(header, x, tableY);
        x += colWidths[i];
      });
      
      tableY += 8;
      
      // Table rows
      filteredExpenses.forEach((expense, index) => {
        if (tableY > 270) {
          doc.addPage();
          tableY = 20;
        }
        
        x = 14;
        doc.text(format(parseISO(expense.expense_date), 'MMM d, yyyy'), x, tableY);
        x += colWidths[0];
        doc.text(expense.description.substring(0, 30), x, tableY);
        x += colWidths[1];
        doc.text(expense.category.substring(0, 20), x, tableY);
        x += colWidths[2];
        doc.text(expense.status.charAt(0).toUpperCase() + expense.status.slice(1), x, tableY);
        x += colWidths[3];
        doc.text(formatCurrency(expense.amount), x, tableY);
        
        tableY += 6;
      });
      
      doc.save(`expense-report-${startDate}-to-${endDate}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Reports</h1>
          <p className="text-muted-foreground">Analyze and export your expense data.</p>
        </div>
        <Button onClick={exportToPDF} disabled={isExporting || !filteredExpenses.length}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2" />}
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Date Range & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select onValueChange={setPresetRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">{stats.count} expenses</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.approved)}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.rejected)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No expense data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Expenses by approval status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No expense data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expense Details
          </CardTitle>
          <CardDescription>
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredExpenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(expense.expense_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{expense.vendor || '-'}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium">No expenses found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting the date range or filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}