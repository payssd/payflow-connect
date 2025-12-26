import { useState } from 'react';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { useEmployees, type Employee } from '@/hooks/useEmployees';

export default function Employees() {
  const { employees, isLoading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingEmployee) {
        return await updateEmployee(editingEmployee.id, data);
      } else {
        return await createEmployee(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
        <p className="text-muted-foreground">Manage your team members and their information.</p>
      </div>

      <EmployeeList
        employees={employees}
        isLoading={isLoading}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={deleteEmployee}
      />

      <EmployeeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        employee={editingEmployee}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}
