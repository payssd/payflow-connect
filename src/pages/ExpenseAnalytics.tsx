import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, eachMonthOfInterval } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(30, 70%, 50%)",
];

export default function ExpenseAnalytics() {
  const { currentOrganization } = useAuth();
  const [timeRange, setTimeRange] = useState("12");

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses-analytics", currentOrganization?.id, timeRange],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const startDate = format(subMonths(new Date(), parseInt(timeRange)), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("organization_id", currentOrganization.id)
        .gte("expense_date", startDate)
        .order("expense_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  const analytics = useMemo(() => {
    if (!expenses.length) {
      return {
        totalSpending: 0,
        avgMonthly: 0,
        topCategory: "N/A",
        monthlyTrend: [],
        categoryBreakdown: [],
        categoryMonthly: [],
        trendPercentage: 0,
      };
    }

    const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const months = parseInt(timeRange);
    const avgMonthly = totalSpending / months;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const topCategory = categoryBreakdown[0]?.name || "N/A";

    // Monthly trend
    const endDate = new Date();
    const startDate = subMonths(endDate, parseInt(timeRange) - 1);
    const monthsInRange = eachMonthOfInterval({ start: startOfMonth(startDate), end: endOfMonth(endDate) });
    
    const monthlyData: Record<string, number> = {};
    monthsInRange.forEach((month) => {
      monthlyData[format(month, "yyyy-MM")] = 0;
    });

    expenses.forEach((e) => {
      const monthKey = format(parseISO(e.expense_date), "yyyy-MM");
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey] += Number(e.amount);
      }
    });

    const monthlyTrend = Object.entries(monthlyData).map(([month, amount]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy"),
      amount,
    }));

    // Calculate trend percentage (compare last 2 months)
    let trendPercentage = 0;
    if (monthlyTrend.length >= 2) {
      const current = monthlyTrend[monthlyTrend.length - 1].amount;
      const previous = monthlyTrend[monthlyTrend.length - 2].amount;
      if (previous > 0) {
        trendPercentage = ((current - previous) / previous) * 100;
      }
    }

    // Category by month for stacked bar chart
    const categoryMonthlyData: Record<string, Record<string, number>> = {};
    monthsInRange.forEach((month) => {
      categoryMonthlyData[format(month, "yyyy-MM")] = {};
    });

    expenses.forEach((e) => {
      const monthKey = format(parseISO(e.expense_date), "yyyy-MM");
      if (categoryMonthlyData[monthKey]) {
        categoryMonthlyData[monthKey][e.category] = 
          (categoryMonthlyData[monthKey][e.category] || 0) + Number(e.amount);
      }
    });

    const allCategories = [...new Set(expenses.map((e) => e.category))];
    const categoryMonthly = Object.entries(categoryMonthlyData).map(([month, cats]) => ({
      month: format(parseISO(month + "-01"), "MMM"),
      ...allCategories.reduce((acc, cat) => ({ ...acc, [cat]: cats[cat] || 0 }), {}),
    }));

    return {
      totalSpending,
      avgMonthly,
      topCategory,
      monthlyTrend,
      categoryBreakdown,
      categoryMonthly,
      trendPercentage,
      allCategories,
    };
  }, [expenses, timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Analytics</h1>
          <p className="text-muted-foreground">Analyze spending trends and patterns</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalSpending)}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange} months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.avgMonthly)}</div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            {analytics.trendPercentage >= 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.trendPercentage >= 0 ? "text-destructive" : "text-green-600"}`}>
              {analytics.trendPercentage >= 0 ? "+" : ""}
              {analytics.trendPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs previous month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topCategory}</div>
            <p className="text-xs text-muted-foreground">Highest spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Spending Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analytics.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Breakdown by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryMonthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis 
                  className="text-xs" 
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                {analytics.allCategories?.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.categoryBreakdown.map((cat, index) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    {((cat.value / analytics.totalSpending) * 100).toFixed(1)}%
                  </span>
                  <span className="font-semibold">{formatCurrency(cat.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}