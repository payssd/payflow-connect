import { useState } from 'react';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers, type Customer } from '@/hooks/useCustomers';

export default function Customers() {
  const { customers, isLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        return await updateCustomer(editingCustomer.id, data);
      } else {
        return await createCustomer(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">Manage your customers for invoicing.</p>
      </div>

      <CustomerList
        customers={customers}
        isLoading={isLoading}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={deleteCustomer}
      />

      <CustomerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={editingCustomer}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
