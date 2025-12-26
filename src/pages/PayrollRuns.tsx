import { useState } from 'react';
import { PayrollList } from '@/components/payroll/PayrollList';
import { PayrollForm } from '@/components/payroll/PayrollForm';
import { PayrollDetail } from '@/components/payroll/PayrollDetail';
import { usePayrollRuns, type PayrollRun } from '@/hooks/usePayrollRuns';
import { useEmployees } from '@/hooks/useEmployees';

export default function PayrollRuns() {
  const { payrollRuns, isLoading, createPayrollRun, updatePayrollRun, deletePayrollRun, getPayrollRunWithItems } = usePayrollRuns();
  const { employees } = useEmployees();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNew = () => {
    setIsFormOpen(true);
  };

  const handleView = (run: PayrollRun) => {
    setSelectedRun(run);
    setIsDetailOpen(true);
  };

  const handleSubmit = async (data: any, selectedEmployees: any[]) => {
    setIsSubmitting(true);
    try {
      return await createPayrollRun(data, selectedEmployees);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const result = await updatePayrollRun(id, { status: status as any });
    if (result && selectedRun?.id === id) {
      setSelectedRun(result);
    }
    return result;
  };

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
        <p className="text-muted-foreground">Process employee salaries with automatic Kenya tax calculations (PAYE, NHIF, NSSF).</p>
      </div>

      <PayrollList
        payrollRuns={payrollRuns}
        isLoading={isLoading}
        onAddNew={handleAddNew}
        onView={handleView}
        onDelete={deletePayrollRun}
        onUpdateStatus={handleUpdateStatus}
      />

      <PayrollForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        employees={employees}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <PayrollDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        payrollRun={selectedRun}
        getPayrollRunWithItems={getPayrollRunWithItems}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
