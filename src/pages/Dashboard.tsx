import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Brand-aligned chart colors
const CHART_COLORS = [
  'hsl(234 70% 42%)',  // Primary - Deep Indigo
  'hsl(152 60% 40%)',  // Success - Emerald
  'hsl(199 89% 48%)',  // Info - Cyan
  'hsl(38 92% 50%)',   // Warning - Amber
  'hsl(280 65% 50%)',  // Purple
  'hsl(350 65% 55%)',  // Rose
];

export default function Dashboard() {
  const { profile, currentOrganization } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const statCards = [
    {
      name: 'Total Employees',
      value: stats?.employeeCount?.toString() || '0',
      change: stats?.employeeChange ? `${stats.employeeChange > 0 ? '+' : ''}${stats.employeeChange}%` : '+0%',
      changeType: (stats?.employeeChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Users,
      href: '/payroll/employees',
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      name: 'Pending Invoices',
      value: stats?.pendingInvoicesCount?.toString() || '0',
      change: `KES ${(stats?.pendingInvoicesAmount || 0).toLocaleString()}`,
      changeType: 'neutral',
      icon: FileText,
      href: '/invoices',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      name: 'This Month Payroll',
      value: `KES ${(stats?.thisMonthPayroll || 0).toLocaleString()}`,
      change: stats?.payrollChange ? `${stats.payrollChange > 0 ? '+' : ''}${stats.payrollChange}%` : '+0%',
      changeType: (stats?.payrollChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Wallet,
      href: '/payroll/runs',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      name: 'Revenue (Paid)',
      value: `KES ${(stats?.paidRevenueThisMonth || 0).toLocaleString()}`,
      change: stats?.revenueChange ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%` : '+0%',
      changeType: (stats?.revenueChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: TrendingUp,
      href: '/reports/invoices',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const quickActions = [
    { name: 'Add Employee', href: '/payroll/employees/new', icon: Users },
    { name: 'Create Invoice', href: '/invoices/new', icon: FileText },
    { name: 'Run Payroll', href: '/payroll/runs/new', icon: Wallet },
    { name: 'Add Expense', href: '/expenses', icon: Receipt },
  ];

  const getStatusIcon = (status: 'success' | 'warning' | 'info') => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Clock className="h-4 w-4 text-info" />;
    }
  };

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with {currentOrganization?.name} today.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map((action) => (
            <Button key={action.name} variant="outline" asChild className="gap-2">
              <Link to={action.href}>
                <action.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.name}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.href}>
            <Card className="card-hover cursor-pointer border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.changeType === 'increase' && (
                    <ArrowUpRight className="h-3 w-3 text-success" />
                  )}
                  {stat.changeType === 'decrease' && (
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={`text-xs ${
                      stat.changeType === 'increase'
                        ? 'text-success'
                        : stat.changeType === 'decrease'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {stat.change}
                  </span>
                  {stat.changeType !== 'neutral' && (
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses Chart */}
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
            <CardDescription>Last 6 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">No data yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create invoices and record expenses to see trends
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Expenses by Category</CardTitle>
            <CardDescription>This month's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.expensesByCategory && stats.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`KES ${value.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">No expenses this month</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <Link to="/expenses" className="text-primary hover:underline">
                    Start tracking expenses
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start by adding employees or creating invoices
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
            <CardDescription>Complete these steps to set up your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Add your first employee', description: 'Set up employee profiles for payroll', href: '/payroll/employees', done: (stats?.employeeCount || 0) > 0 },
                { title: 'Connect a payment gateway', description: 'Link your M-Pesa or bank account', href: '/settings/gateways', done: false },
                { title: 'Create your first invoice', description: 'Send professional invoices to customers', href: '/invoices', done: false },
                { title: 'Track your expenses', description: 'Record and categorize business expenses', href: '/expenses', done: (stats?.expensesByCategory?.length || 0) > 0 },
              ].map((step, index) => (
                <Link
                  key={index}
                  to={step.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.done
                        ? 'bg-success text-success-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}