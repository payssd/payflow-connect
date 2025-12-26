import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users, Calculator } from 'lucide-react';
import { calculateTax, formatKES } from '@/lib/kenyaTax';
import type { Employee } from '@/hooks/useEmployees';

const payrollSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pay_period_start: z.string().min(1, 'Start date required'),
  pay_period_end: z.string().min(1, 'End date required'),
  payment_date: z.string().min(1, 'Payment date required'),
  notes: z.string().optional(),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

interface PayrollFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSubmit: (data: any, employees: Employee[]) => Promise<any>;
  isLoading?: boolean;
}

export function PayrollForm({ open, onOpenChange, employees, onSubmit, isLoading }: PayrollFormProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{
    totalGross: number;
    totalPaye: number;
    totalNhif: number;
    totalNssf: number;
    totalNet: number;
    count: number;
  } | null>(null);

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      name: `${monthName} Payroll`,
      pay_period_start: firstOfMonth,
      pay_period_end: lastOfMonth,
      payment_date: lastOfMonth,
      notes: '',
    },
  });

  const eligibleEmployees = employees.filter(emp => emp.status === 'active' && Number(emp.base_salary) > 0);

  useEffect(() => {
    // Auto-select all eligible employees
    setSelectedEmployees(new Set(eligibleEmployees.map(emp => emp.id)));
  }, [employees]);

  useEffect(() => {
    // Calculate preview
    const selected = eligibleEmployees.filter(emp => selectedEmployees.has(emp.id));
    if (selected.length === 0) {
      setPreview(null);
      return;
    }

    const totals = selected.reduce(
      (acc, emp) => {
        const gross = Number(emp.base_salary);
        const tax = calculateTax(gross);
        return {
          totalGross: acc.totalGross + gross,
          totalPaye: acc.totalPaye + tax.paye,
          totalNhif: acc.totalNhif + tax.nhif,
          totalNssf: acc.totalNssf + tax.nssf,
          totalNet: acc.totalNet + tax.netPay,
          count: acc.count + 1,
        };
      },
      { totalGross: 0, totalPaye: 0, totalNhif: 0, totalNssf: 0, totalNet: 0, count: 0 }
    );

    setPreview(totals);
  }, [selectedEmployees, employees]);

  const toggleEmployee = (id: string) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEmployees(newSet);
  };

  const toggleAll = () => {
    if (selectedEmployees.size === eligibleEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(eligibleEmployees.map(emp => emp.id)));
    }
  };

  const handleFormSubmit = async (data: PayrollFormData) => {
    const selected = eligibleEmployees.filter(emp => selectedEmployees.has(emp.id));
    if (selected.length === 0) return;

    const result = await onSubmit(data, selected);
    if (result) {
      reset();
      onOpenChange(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payroll Run</DialogTitle>
          <DialogDescription>Process salaries for your employees with automatic tax calculations.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Payroll Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Payroll Name *</Label>
                <Input id="name" {...register('name')} placeholder="December 2024 Payroll" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay_period_start">Period Start *</Label>
                <Input id="pay_period_start" type="date" {...register('pay_period_start')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_period_end">Period End *</Label>
                <Input id="pay_period_end" type="date" {...register('pay_period_end')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input id="payment_date" type="date" {...register('payment_date')} />
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="h-4 w-4" />
                Select Employees ({selectedEmployees.size} selected)
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                {selectedEmployees.size === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {eligibleEmployees.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No eligible employees found. Add employees with active status and salary first.
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {eligibleEmployees.map((emp) => {
                  const tax = calculateTax(Number(emp.base_salary));
                  return (
                    <div
                      key={emp.id}
                      className="flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <Checkbox 
                        checked={selectedEmployees.has(emp.id)} 
                        onCheckedChange={() => toggleEmployee(emp.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(emp.first_name, emp.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{emp.first_name} {emp.last_name}</p>
                        <p className="text-sm text-muted-foreground">{emp.job_title || emp.department || 'Employee'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatKES(Number(emp.base_salary))}</p>
                        <p className="text-sm text-muted-foreground">Net: {formatKES(tax.netPay)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Summary */}
          {preview && preview.count > 0 && (
            <Card className="bg-muted/50 border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Payroll Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Gross Pay</p>
                    <p className="font-medium">{formatKES(preview.totalGross)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PAYE</p>
                    <p className="font-medium text-destructive">-{formatKES(preview.totalPaye)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NHIF</p>
                    <p className="font-medium text-destructive">-{formatKES(preview.totalNhif)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NSSF</p>
                    <p className="font-medium text-destructive">-{formatKES(preview.totalNssf)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Pay</p>
                    <p className="font-bold text-lg text-success">{formatKES(preview.totalNet)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Additional notes..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || selectedEmployees.size === 0}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Payroll Run
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
