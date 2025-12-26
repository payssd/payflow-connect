import { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, Plus, Receipt, Trash2, Pencil, Upload, Image, X, Check, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  alert_threshold: number;
}

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

interface Expense {
  id: string;
  organization_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  vendor: string | null;
  expense_date: string;
  notes: string | null;
  status: string;
  created_by: string;
  created_at: string;
  receipt_url: string | null;
}

export default function Expenses() {
  const { currentOrganization, user, currentMembership } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingExpense, setRejectingExpense] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    vendor: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!currentOrganization,
  });

  // Fetch budgets
  const { data: budgets } = useQuery({
    queryKey: ['expense-budgets', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      const { data, error } = await supabase
        .from('expense_budgets')
        .select('*')
        .eq('organization_id', currentOrganization.id);
      
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!currentOrganization,
  });

  // Calculate monthly spending by category
  const monthlySpending = useMemo(() => {
    if (!expenses) return {};
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const spending: Record<string, number> = {};
    expenses
      .filter(e => {
        const date = new Date(e.expense_date);
        return date >= monthStart && date <= monthEnd && (e.status === 'pending' || e.status === 'approved');
      })
      .forEach(e => {
        spending[e.category] = (spending[e.category] || 0) + Number(e.amount);
      });
    return spending;
  }, [expenses]);

  // Get budget alerts
  const budgetAlerts = useMemo(() => {
    if (!budgets) return [];
    return budgets
      .map(budget => {
        const spent = monthlySpending[budget.category] || 0;
        const percentage = (spent / budget.monthly_limit) * 100;
        const isOver = percentage >= 100;
        const isWarning = percentage >= budget.alert_threshold && !isOver;
        return { ...budget, spent, percentage, isOver, isWarning };
      })
      .filter(b => b.isOver || b.isWarning)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, monthlySpending]);

  // Get budget info for selected category in form
  const selectedCategoryBudget = useMemo(() => {
    if (!formData.category || !budgets) return null;
    const budget = budgets.find(b => b.category === formData.category);
    if (!budget) return null;
    const spent = monthlySpending[formData.category] || 0;
    const newAmount = parseFloat(formData.amount) || 0;
    const projectedSpent = spent + newAmount;
    const percentage = (projectedSpent / budget.monthly_limit) * 100;
    return { budget, spent, projectedSpent, percentage };
  }, [formData.category, formData.amount, budgets, monthlySpending]);

  const uploadReceipt = async (file: File, expenseId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentOrganization?.id}/${expenseId}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please upload an image under 5MB.', variant: 'destructive' });
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentOrganization || !user) throw new Error('Not authenticated');
      
      setIsUploading(true);
      
      const { data: insertedExpense, error } = await supabase.from('expenses').insert({
        organization_id: currentOrganization.id,
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        vendor: data.vendor || null,
        expense_date: data.expense_date,
        notes: data.notes || null,
        created_by: user.id,
      }).select().single();
      
      if (error) throw error;
      
      if (receiptFile && insertedExpense) {
        const receiptUrl = await uploadReceipt(receiptFile, insertedExpense.id);
        await supabase.from('expenses')
          .update({ receipt_url: receiptUrl })
          .eq('id', insertedExpense.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense created', description: 'The expense has been recorded.' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
    onSettled: () => setIsUploading(false),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      setIsUploading(true);
      
      let receiptUrl = editingExpense?.receipt_url || null;
      
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile, id);
      }
      
      const { error } = await supabase
        .from('expenses')
        .update({
          description: data.description,
          amount: parseFloat(data.amount),
          category: data.category,
          vendor: data.vendor || null,
          expense_date: data.expense_date,
          notes: data.notes || null,
          receipt_url: receiptUrl,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense updated', description: 'The expense has been updated.' });
      resetForm();
      setIsDialogOpen(false);
      setEditingExpense(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
    onSettled: () => setIsUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Expense deleted', description: 'The expense has been removed.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const canApprove = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  const approvalMutation = useMutation({
    mutationFn: async ({ expenseId, status, reason }: { expenseId: string; status: 'approved' | 'rejected'; reason?: string }) => {
      // Get expense first
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (fetchError) throw fetchError;

      // Get submitter profile
      const { data: submitterProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', expense.created_by)
        .maybeSingle();

      const { error } = await supabase
        .from('expenses')
        .update({ status })
        .eq('id', expenseId);

      if (error) throw error;

      // Send notification email
      if (submitterProfile?.email) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: status === 'approved' ? 'expense_approved' : 'expense_rejected',
              to: submitterProfile.email,
              data: {
                recipientName: submitterProfile.full_name,
                expenseDescription: expense.description,
                expenseCategory: expense.category,
                amount: expense.amount,
                currency: expense.currency,
                organizationName: currentOrganization?.name,
                rejectionReason: reason,
              },
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: variables.status === 'approved' ? 'Expense Approved' : 'Expense Rejected',
        description: `The expense has been ${variables.status}.`,
      });
      setRejectDialogOpen(false);
      setRejectingExpense(null);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      vendor: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    clearReceipt();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      vendor: expense.vendor || '',
      expense_date: expense.expense_date,
      notes: expense.notes || '',
    });
    if (expense.receipt_url) {
      setReceiptPreview(expense.receipt_url);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleApprove = (expense: Expense) => {
    approvalMutation.mutate({ expenseId: expense.id, status: 'approved' });
  };

  const handleReject = () => {
    if (rejectingExpense) {
      approvalMutation.mutate({
        expenseId: rejectingExpense.id,
        status: 'rejected',
        reason: rejectionReason,
      });
    }
  };

  const openRejectDialog = (expense: Expense) => {
    setRejectingExpense(expense);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredExpenses = expenses?.filter(e => 
    statusFilter === 'all' ? true : e.status === statusFilter
  );

  const totalExpenses = filteredExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const pendingCount = expenses?.filter(e => e.status === 'pending').length || 0;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Office Supplies': 'bg-blue-100 text-blue-800',
      'Travel': 'bg-purple-100 text-purple-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Software & Subscriptions': 'bg-green-100 text-green-800',
      'Marketing': 'bg-pink-100 text-pink-800',
      'Professional Services': 'bg-indigo-100 text-indigo-800',
      'Equipment': 'bg-orange-100 text-orange-800',
      'Insurance': 'bg-teal-100 text-teal-800',
      'Rent': 'bg-red-100 text-red-800',
      'Meals & Entertainment': 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="ml-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-800">Budget Alerts</p>
                <p className="text-sm text-yellow-700">
                  {budgetAlerts.filter(b => b.isOver).length > 0 && (
                    <span className="text-destructive font-medium">
                      {budgetAlerts.filter(b => b.isOver).length} over budget
                    </span>
                  )}
                  {budgetAlerts.filter(b => b.isOver).length > 0 && budgetAlerts.filter(b => b.isWarning).length > 0 && ', '}
                  {budgetAlerts.filter(b => b.isWarning).length > 0 && (
                    <span>{budgetAlerts.filter(b => b.isWarning).length} approaching limit</span>
                  )}
                </p>
              </div>
              <Link to="/expenses/budgets">
                <Button variant="outline" size="sm">View Budgets</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and categorize your business expenses.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingExpense(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
              <DialogDescription>
                {editingExpense ? 'Update the expense details.' : 'Record a new business expense.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="What was this expense for?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (KES) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Date *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    placeholder="Who was paid?"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                  />
                </div>
              </div>
              {/* Budget Warning */}
              {selectedCategoryBudget && (
                <Alert className={selectedCategoryBudget.percentage >= 100 ? 'border-destructive' : selectedCategoryBudget.percentage >= selectedCategoryBudget.budget.alert_threshold ? 'border-yellow-500' : 'border-green-500'}>
                  <AlertTriangle className={`h-4 w-4 ${selectedCategoryBudget.percentage >= 100 ? 'text-destructive' : selectedCategoryBudget.percentage >= selectedCategoryBudget.budget.alert_threshold ? 'text-yellow-600' : 'text-green-600'}`} />
                  <AlertDescription className="ml-2">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>{formData.category}</strong> budget: KES {selectedCategoryBudget.budget.monthly_limit.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current: KES {selectedCategoryBudget.spent.toLocaleString()} | 
                        After this: KES {selectedCategoryBudget.projectedSpent.toLocaleString()} ({selectedCategoryBudget.percentage.toFixed(0)}%)
                      </p>
                      <Progress value={Math.min(selectedCategoryBudget.percentage, 100)} className="h-2" />
                      {selectedCategoryBudget.percentage >= 100 && (
                        <p className="text-xs text-destructive font-medium">This will exceed the budget!</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Receipt</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {receiptPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="h-24 w-24 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={clearReceipt}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
                  {(createMutation.isPending || updateMutation.isPending || isUploading) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalExpenses.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredExpenses?.length || 0} expense{filteredExpenses?.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-yellow-600" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filter by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expenses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredExpenses && filteredExpenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{expense.description}</div>
                      {expense.vendor && (
                        <div className="text-xs text-muted-foreground">{expense.vendor}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>
                      {expense.receipt_url ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingReceipt(expense.receipt_url)}
                        >
                          <Image className="h-4 w-4 text-primary" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      KES {Number(expense.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canApprove && expense.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(expense)}
                              disabled={approvalMutation.isPending}
                              title="Approve"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openRejectDialog(expense)}
                              disabled={approvalMutation.isPending}
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(expense.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
                {statusFilter !== 'all' ? 'Try changing the filter' : 'Start tracking your business expenses'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {viewingReceipt && (
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="w-full h-auto max-h-[70vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Expense</Label>
              <p className="text-sm text-muted-foreground">
                {rejectingExpense?.description} - KES {rejectingExpense?.amount.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Reason (optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Why is this expense being rejected?"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={approvalMutation.isPending}
              >
                {approvalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Reject Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
