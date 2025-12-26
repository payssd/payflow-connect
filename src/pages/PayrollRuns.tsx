import { useState } from 'react';
import { PayrollList } from '@/components/payroll/PayrollList';
import { PayrollForm } from '@/components/payroll/PayrollForm';
import { PayrollDetail } from '@/components/payroll/PayrollDetail';
import { PayrollDisclaimer } from '@/components/payroll/PayrollDisclaimer';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { usePayrollRuns, type PayrollRun } from '@/hooks/usePayrollRuns';
import { useEmployees } from '@/hooks/useEmployees';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

function PayrollRunsContent() {
  const { payrollRuns, isLoading, createPayrollRun, updatePayrollRun, deletePayrollRun, getPayrollRunWithItems } = usePayrollRuns();
  const { employees, isLoading: employeesLoading, error: employeesError } = useEmployees();
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

  // Show loading state while employees are loading
  if (employeesLoading && !employees.length) {
    return (
      <div className="space-y-6 page-transition">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
          <p className="text-muted-foreground">Process employee salaries with automatic Kenya tax calculations (PAYE, NHIF, NSSF, Housing Levy).</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show error if employees failed to load
  if (employeesError) {
    return (
      <div className="space-y-6 page-transition">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
          <p className="text-muted-foreground">Process employee salaries with automatic Kenya tax calculations (PAYE, NHIF, NSSF, Housing Levy).</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load employees: {employeesError}. Please refresh the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
        <p className="text-muted-foreground">Process employee salaries with automatic Kenya tax calculations (PAYE, NHIF, NSSF, Housing Levy).</p>
      </div>

      {/* Assisted Payroll Disclaimer */}
      <PayrollDisclaimer />

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

export default function PayrollRuns() {
  return (
    <PageErrorBoundary pageName="Payroll Runs">
      <PayrollRunsContent />
    </PageErrorBoundary>
  );
}
