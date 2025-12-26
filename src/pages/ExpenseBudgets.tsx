import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Pencil, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const categories = [
  'Office Supplies',
  'Travel',
  'Utilities',
  'Software & Subscriptions',
  'Marketing',
  'Professional Services',
  'Equipment',
  'Insurance',
  'Rent',
  'Meals & Entertainment',
  'Other',
];

interface Budget {
  id: string;
  organization_id: string;
  category: string;
  monthly_limit: number;
  alert_threshold: number;
  created_at: string;
  updated_at: string;
}

interface CategorySpending {
  category: string;
  spent: number;
  budget: Budget | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ExpenseBudgets() {
  const { currentOrganization, currentMembership } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    monthly_limit: '',
    alert_threshold: '80',
  });

  const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  // Fetch budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['expense-budgets', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('expense_budgets')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('category');
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!currentOrganization,
  });

  // Fetch current month expenses
  const { data: monthlyExpenses } = useQuery({
    queryKey: ['monthly-expenses', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const now = new Date();
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount, status')
        .eq('organization_id', currentOrganization.id)
        .gte('expense_date', format(startOfMonth(now), 'yyyy-MM-dd'))
        .lte('expense_date', format(endOfMonth(now), 'yyyy-MM-dd'))
        .in('status', ['pending', 'approved']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization,
  });

  // Calculate spending by category
  const categorySpending: CategorySpending[] = categories.map(category => {
    const spent = monthlyExpenses
      ?.filter(e => e.category === category)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const budget = budgets?.find(b => b.category === category) || null;
    return { category, spent, budget };
  }).filter(c => c.spent > 0 || c.budget);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentOrganization) throw new Error('No organization');
      
      const { error } = await supabase.from('expense_budgets').insert({
        organization_id: currentOrganization.id,
        category: data.category,
        monthly_limit: parseFloat(data.monthly_limit),
        alert_threshold: parseFloat(data.alert_threshold),
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-budgets'] });
      toast({ title: 'Budget created', description: 'The budget limit has been set.' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('expense_budgets')
        .update({
          monthly_limit: parseFloat(data.monthly_limit),
          alert_threshold: parseFloat(data.alert_threshold),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-budgets'] });
      toast({ title: 'Budget updated', description: 'The budget limit has been updated.' });
      resetForm();
      setIsDialogOpen(false);
      setEditingBudget(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expense_budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-budgets'] });
      toast({ title: 'Budget deleted', description: 'The budget limit has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({ category: '', monthly_limit: '', alert_threshold: '80' });
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      monthly_limit: budget.monthly_limit.toString(),
      alert_threshold: budget.alert_threshold.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.monthly_limit) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (spent: number, budget: Budget | null) => {
    if (!budget) return 'default';
    const percentage = (spent / budget.monthly_limit) * 100;
    if (percentage >= 100) return 'destructive';
    if (percentage >= budget.alert_threshold) return 'warning';
    return 'success';
  };

  const getProgressColor = (spent: number, budget: Budget | null) => {
    if (!budget) return 'bg-primary';
    const percentage = (spent / budget.monthly_limit) * 100;
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= budget.alert_threshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const usedCategories = budgets?.map(b => b.category) || [];
  const availableCategories = categories.filter(c => !usedCategories.includes(c) || editingBudget?.category === c);

  const overBudgetCount = categorySpending.filter(c => c.budget && c.spent >= c.budget.monthly_limit).length;
  const warningCount = categorySpending.filter(c => 
    c.budget && c.spent >= (c.budget.monthly_limit * c.budget.alert_threshold / 100) && c.spent < c.budget.monthly_limit
  ).length;

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Budgets</h1>
          <p className="text-muted-foreground">
            Set monthly spending limits per category and track your expenses.
          </p>
        </div>
        {canManage && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingBudget(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button disabled={availableCategories.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
                <DialogDescription>
                  {editingBudget ? 'Update the budget limit for this category.' : 'Set a monthly spending limit for a category.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    disabled={!!editingBudget}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_limit">Monthly Limit (USD) *</Label>
                  <Input
                    id="monthly_limit"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="50000"
                    value={formData.monthly_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_limit: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert_threshold">Alert Threshold (%)</Label>
                  <Input
                    id="alert_threshold"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="80"
                    value={formData.alert_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, alert_threshold: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll be alerted when spending reaches this percentage of the budget.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {editingBudget ? 'Update' : 'Create'} Budget
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Budgets Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">of {categories.length} categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Approaching Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground">categories need attention</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-destructive" />
              Over Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overBudgetCount}</div>
            <p className="text-xs text-muted-foreground">categories exceeded</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Cards */}
      {budgetsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : categorySpending.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categorySpending.map(({ category, spent, budget }) => {
            const percentage = budget ? Math.min((spent / budget.monthly_limit) * 100, 100) : 0;
            const isOverBudget = budget && spent >= budget.monthly_limit;
            const isWarning = budget && spent >= (budget.monthly_limit * budget.alert_threshold / 100) && !isOverBudget;
            
            return (
              <Card key={category} className={`border-0 shadow-card ${isOverBudget ? 'ring-2 ring-destructive' : isWarning ? 'ring-2 ring-yellow-500' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category}</CardTitle>
                    {budget && canManage && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(budget)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(budget.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {(isOverBudget || isWarning) && (
                    <Badge variant={isOverBudget ? 'destructive' : 'secondary'} className={isWarning ? 'bg-yellow-100 text-yellow-800' : ''}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {isOverBudget ? 'Over Budget!' : 'Approaching Limit'}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent this month</span>
                      <span className="font-medium">{formatCurrency(spent)}</span>
                    </div>
                    {budget ? (
                      <>
                        <div className="relative">
                          <Progress value={percentage} className="h-3" />
                          <div 
                            className={`absolute inset-0 h-3 rounded-full ${getProgressColor(spent, budget)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(0)}% used</span>
                          <span>Limit: {formatCurrency(budget.monthly_limit)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Remaining: {formatCurrency(Math.max(0, budget.monthly_limit - spent))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No budget set for this category</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium">No budgets or expenses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set category budgets to track your spending limits
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}