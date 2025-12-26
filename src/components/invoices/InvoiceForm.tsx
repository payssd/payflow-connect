import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Customer } from '@/hooks/useCustomers';
import type { InvoiceInsert, InvoiceItemInsert } from '@/hooks/useInvoices';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.coerce.number().min(0.01, 'Quantity required'),
  unit_price: z.coerce.number().min(0, 'Price required'),
});

const invoiceSchema = z.object({
  customer_id: z.string().optional(),
  customer_name: z.string().min(1, 'Customer name required'),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_address: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date required'),
  due_date: z.string().min(1, 'Due date required'),
  tax_rate: z.coerce.number().min(0).max(100).default(16),
  discount_amount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onSubmit: (
    invoice: Omit<InvoiceInsert, 'organization_id' | 'invoice_number'>,
    items: Omit<InvoiceItemInsert, 'invoice_id'>[]
  ) => Promise<any>;
  isLoading?: boolean;
}

export function InvoiceForm({ open, onOpenChange, customers, onSubmit, isLoading }: InvoiceFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: '',
      customer_name: '',
      customer_email: '',
      customer_address: '',
      issue_date: today,
      due_date: defaultDueDate,
      tax_rate: 16,
      discount_amount: 0,
      notes: '',
      terms: 'Payment is due within the specified due date.',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const taxRate = watch('tax_rate');
  const discountAmount = watch('discount_amount');

  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discountAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setValue('customer_id', customerId);
      setValue('customer_name', customer.name);
      setValue('customer_email', customer.email || '');
      setValue('customer_address', customer.address || '');
      if (customer.payment_terms) {
        const dueDate = new Date(Date.now() + customer.payment_terms * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setValue('due_date', dueDate);
      }
    }
  };

  const handleFormSubmit = async (data: InvoiceFormData) => {
    const invoiceItems = data.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
    }));

    const result = await onSubmit(
      {
        customer_id: data.customer_id || null,
        customer_name: data.customer_name,
        customer_email: data.customer_email || null,
        customer_address: data.customer_address || null,
        issue_date: data.issue_date,
        due_date: data.due_date,
        tax_rate: data.tax_rate,
        discount_amount: data.discount_amount,
        notes: data.notes || null,
        terms: data.terms || null,
      },
      invoiceItems
    );

    if (result) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>Fill in the details to create a new invoice.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Customer</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Existing Customer</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input id="customer_name" {...register('customer_name')} placeholder="Enter customer name" />
                {errors.customer_name && <p className="text-sm text-destructive">{errors.customer_name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_email">Email</Label>
                <Input id="customer_email" type="email" {...register('customer_email')} placeholder="billing@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_address">Address</Label>
                <Input id="customer_address" {...register('customer_address')} placeholder="123 Main St, City" />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Invoice Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date *</Label>
                <Input id="issue_date" type="date" {...register('issue_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input id="due_date" type="date" {...register('due_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">VAT Rate (%)</Label>
                <Input id="tax_rate" type="number" step="0.01" {...register('tax_rate')} />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Items</h3>
            {fields.map((field, index) => (
              <Card key={field.id} className="border shadow-none">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6 space-y-2">
                      <Label>Description *</Label>
                      <Input {...register(`items.${index}.description`)} placeholder="Item description" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Qty *</Label>
                      <Input type="number" step="0.01" {...register(`items.${index}.quantity`)} placeholder="1" />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label>Unit Price *</Label>
                      <Input type="number" step="0.01" {...register(`items.${index}.unit_price`)} placeholder="0.00" />
                    </div>
                    <div className="col-span-1">
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {errors.items?.[index] && (
                    <p className="text-sm text-destructive mt-2">Please fill in all item fields</p>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Summary */}
          <Card className="bg-muted/50 border-0">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} placeholder="Additional notes..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">Payment Terms</Label>
              <Textarea id="terms" {...register('terms')} placeholder="Payment terms..." rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
