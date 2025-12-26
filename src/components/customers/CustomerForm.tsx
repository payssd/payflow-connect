import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Customer, CustomerInsert } from '@/hooks/useCustomers';

const customerSchema = z.object({
  customer_number: z.string().max(50).optional(),
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  contact_person: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  tax_pin: z.string().max(50).optional(),
  payment_terms: z.coerce.number().min(0).max(365).default(30),
  notes: z.string().max(1000).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: Omit<CustomerInsert, 'organization_id'>) => Promise<any>;
  isLoading?: boolean;
}

export function CustomerForm({ open, onOpenChange, customer, onSubmit, isLoading }: CustomerFormProps) {
  const isEditing = !!customer;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_number: customer?.customer_number || '',
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      contact_person: customer?.contact_person || '',
      address: customer?.address || '',
      city: customer?.city || '',
      tax_pin: customer?.tax_pin || '',
      payment_terms: customer?.payment_terms || 30,
      notes: customer?.notes || '',
    },
  });

  const handleFormSubmit = async (data: CustomerFormData) => {
    const result = await onSubmit({
      name: data.name,
      customer_number: data.customer_number || null,
      email: data.email || null,
      phone: data.phone || null,
      contact_person: data.contact_person || null,
      address: data.address || null,
      city: data.city || null,
      tax_pin: data.tax_pin || null,
      payment_terms: data.payment_terms,
      notes: data.notes || null,
    });
    if (result) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update customer details.' : 'Add a new customer for invoicing.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} placeholder="Acme Corp" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_number">Customer #</Label>
              <Input id="customer_number" {...register('customer_number')} placeholder="CUST001" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="billing@acme.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} placeholder="+254 700 000 000" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input id="contact_person" {...register('contact_person')} placeholder="John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="123 Main St" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} placeholder="Nairobi" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_pin">KRA PIN</Label>
              <Input id="tax_pin" {...register('tax_pin')} placeholder="A123456789B" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms (days)</Label>
              <Input id="payment_terms" type="number" {...register('payment_terms')} placeholder="30" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Additional notes..." rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
