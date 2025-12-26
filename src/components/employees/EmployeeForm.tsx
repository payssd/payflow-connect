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

const employeeSchema = z.object({
  employee_number: z.string().optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').max(255),
  phone: z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'intern']).default('full-time'),
  status: z.enum(['active', 'inactive', 'terminated']).default('active'),
  hire_date: z.string().optional(),
  date_of_birth: z.string().optional(),
  national_id: z.string().max(50).optional(),
  tax_pin: z.string().max(50).optional(),
  bank_name: z.string().max(100).optional(),
  bank_account_number: z.string().max(50).optional(),
  bank_branch: z.string().max(100).optional(),
  base_salary: z.coerce.number().min(0).default(0),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
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
      employment_type: (employee?.employment_type as any) || 'full-time',
      status: (employee?.status as any) || 'active',
      hire_date: employee?.hire_date || '',
      date_of_birth: employee?.date_of_birth || '',
      national_id: employee?.national_id || '',
      tax_pin: employee?.tax_pin || '',
      bank_name: employee?.bank_name || '',
      bank_account_number: employee?.bank_account_number || '',
      bank_branch: employee?.bank_branch || '',
      base_salary: Number(employee?.base_salary) || 0,
      address: employee?.address || '',
      city: employee?.city || '',
      emergency_contact_name: employee?.emergency_contact_name || '',
      emergency_contact_phone: employee?.emergency_contact_phone || '',
      notes: employee?.notes || '',
    },
  });

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const result = await onSubmit({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      employee_number: data.employee_number || null,
      phone: data.phone || null,
      department: data.department || null,
      job_title: data.job_title || null,
      employment_type: data.employment_type,
      status: data.status,
      hire_date: data.hire_date || null,
      date_of_birth: data.date_of_birth || null,
      national_id: data.national_id || null,
      tax_pin: data.tax_pin || null,
      bank_name: data.bank_name || null,
      bank_account_number: data.bank_account_number || null,
      bank_branch: data.bank_branch || null,
      base_salary: data.base_salary,
      address: data.address || null,
      city: data.city || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      notes: data.notes || null,
    });
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
                <Label htmlFor="email">Email *</Label>
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
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={watch('employment_type')}
                  onValueChange={(value) => setValue('employment_type', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">Base Salary (KES)</Label>
              <Input id="base_salary" type="number" step="0.01" {...register('base_salary')} placeholder="50000" />
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bank Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input id="bank_name" {...register('bank_name')} placeholder="Equity Bank" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input id="bank_account_number" {...register('bank_account_number')} placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_branch">Branch</Label>
                <Input id="bank_branch" {...register('bank_branch')} placeholder="Nairobi" />
              </div>
            </div>
          </div>

          {/* Tax & ID */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tax & Identification</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="national_id">National ID</Label>
                <Input id="national_id" {...register('national_id')} placeholder="12345678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_pin">KRA PIN</Label>
                <Input id="tax_pin" {...register('tax_pin')} placeholder="A123456789B" />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input id="emergency_contact_name" {...register('emergency_contact_name')} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input id="emergency_contact_phone" {...register('emergency_contact_phone')} placeholder="+254 700 000 000" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Additional notes..." rows={3} />
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
