import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Employee, EmployeeInsert } from '@/hooks/useEmployees';

const MOBILE_MONEY_PROVIDERS = [
  { value: 'mpesa', label: 'M-Pesa (Safaricom)' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'tkash', label: 'T-Kash (Telkom)' },
] as const;

const employeeSchema = z.object({
  employee_number: z.string().optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  hire_date: z.string().optional(),
  termination_date: z.string().optional(),
  national_id: z.string().max(50).optional(),
  kra_pin: z.string().max(50).optional(),
  nhif_number: z.string().max(50).optional(),
  nssf_number: z.string().max(50).optional(),
  // Payment method
  payment_method: z.enum(['bank', 'mobile_money']).default('bank'),
  // Bank details
  bank_name: z.string().max(100).optional(),
  bank_account: z.string().max(50).optional(),
  bank_branch: z.string().max(100).optional(),
  // Mobile money details
  mobile_money_provider: z.string().max(50).optional(),
  mobile_money_number: z.string().max(20).optional(),
  // Salary
  base_salary: z.coerce.number().min(0).default(0),
  housing_allowance: z.coerce.number().min(0).default(0),
  transport_allowance: z.coerce.number().min(0).default(0),
  other_allowances: z.coerce.number().min(0).default(0),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSubmit: (data: Omit<EmployeeInsert, 'organization_id'>) => Promise<any>;
  isLoading?: boolean;
}

export function EmployeeForm({ open, onOpenChange, employee, onSubmit, isLoading }: EmployeeFormProps) {
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_number: employee?.employee_number || '',
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      department: employee?.department || '',
      job_title: employee?.job_title || '',
      status: (employee?.status as any) || 'active',
      hire_date: employee?.hire_date || '',
      termination_date: employee?.termination_date || '',
      national_id: employee?.national_id || '',
      kra_pin: employee?.kra_pin || '',
      nhif_number: employee?.nhif_number || '',
      nssf_number: employee?.nssf_number || '',
      payment_method: ((employee as any)?.payment_method as any) || 'bank',
      bank_name: employee?.bank_name || '',
      bank_account: employee?.bank_account || '',
      bank_branch: employee?.bank_branch || '',
      mobile_money_provider: (employee as any)?.mobile_money_provider || '',
      mobile_money_number: (employee as any)?.mobile_money_number || '',
      base_salary: Number(employee?.base_salary) || 0,
      housing_allowance: Number(employee?.housing_allowance) || 0,
      transport_allowance: Number(employee?.transport_allowance) || 0,
      other_allowances: Number(employee?.other_allowances) || 0,
    },
  });

  const paymentMethod = watch('payment_method');

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const result = await onSubmit({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      employee_number: data.employee_number || null,
      phone: data.phone || null,
      department: data.department || null,
      job_title: data.job_title || null,
      status: data.status,
      hire_date: data.hire_date || null,
      termination_date: data.termination_date || null,
      national_id: data.national_id || null,
      kra_pin: data.kra_pin || null,
      nhif_number: data.nhif_number || null,
      nssf_number: data.nssf_number || null,
      payment_method: data.payment_method,
      bank_name: data.payment_method === 'bank' ? data.bank_name || null : null,
      bank_account: data.payment_method === 'bank' ? data.bank_account || null : null,
      bank_branch: data.payment_method === 'bank' ? data.bank_branch || null : null,
      mobile_money_provider: data.payment_method === 'mobile_money' ? data.mobile_money_provider || null : null,
      mobile_money_number: data.payment_method === 'mobile_money' ? data.mobile_money_number || null : null,
      base_salary: data.base_salary,
      housing_allowance: data.housing_allowance,
      transport_allowance: data.transport_allowance,
      other_allowances: data.other_allowances,
    } as any);
    if (result) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update employee information.' : 'Fill in the details to add a new employee.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input id="first_name" {...register('first_name')} placeholder="John" />
                {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input id="last_name" {...register('last_name')} placeholder="Doe" />
                {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="john@company.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} placeholder="+254 700 000 000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input id="employee_number" {...register('employee_number')} placeholder="EMP001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input id="hire_date" type="date" {...register('hire_date')} />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" {...register('department')} placeholder="Engineering" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input id="job_title" {...register('job_title')} placeholder="Software Engineer" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID</Label>
                <Input id="national_id" {...register('national_id')} placeholder="12345678" />
              </div>
            </div>
          </div>

          {/* Salary & Allowances */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Salary & Allowances (KES)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_salary">Base Salary</Label>
                <Input id="base_salary" type="number" step="0.01" {...register('base_salary')} placeholder="50000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="housing_allowance">Housing Allowance</Label>
                <Input id="housing_allowance" type="number" step="0.01" {...register('housing_allowance')} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transport_allowance">Transport Allowance</Label>
                <Input id="transport_allowance" type="number" step="0.01" {...register('transport_allowance')} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_allowances">Other Allowances</Label>
                <Input id="other_allowances" type="number" step="0.01" {...register('other_allowances')} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Kenya Tax IDs */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Kenya Tax & Statutory IDs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kra_pin">KRA PIN</Label>
                <Input id="kra_pin" {...register('kra_pin')} placeholder="A123456789B" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nhif_number">NHIF Number</Label>
                <Input id="nhif_number" {...register('nhif_number')} placeholder="12345678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nssf_number">NSSF Number</Label>
                <Input id="nssf_number" {...register('nssf_number')} placeholder="12345678" />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Payment Details</h3>
            
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setValue('payment_method', value as 'bank' | 'mobile_money')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Details - shown when bank is selected */}
            {paymentMethod === 'bank' && (
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input id="bank_name" {...register('bank_name')} placeholder="Equity Bank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Account Number</Label>
                  <Input id="bank_account" {...register('bank_account')} placeholder="1234567890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_branch">Branch</Label>
                  <Input id="bank_branch" {...register('bank_branch')} placeholder="Nairobi" />
                </div>
              </div>
            )}

            {/* Mobile Money Details - shown when mobile_money is selected */}
            {paymentMethod === 'mobile_money' && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="mobile_money_provider">Mobile Money Provider</Label>
                  <Select
                    value={watch('mobile_money_provider') || ''}
                    onValueChange={(value) => setValue('mobile_money_provider', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILE_MONEY_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile_money_number">Phone Number</Label>
                  <Input 
                    id="mobile_money_number" 
                    {...register('mobile_money_number')} 
                    placeholder="+254 7XX XXX XXX" 
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the registered mobile money number
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
