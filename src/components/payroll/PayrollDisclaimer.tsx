import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface PayrollDisclaimerProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function PayrollDisclaimer({ variant = 'default', className = '' }: PayrollDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        <AlertTriangle className="h-3 w-3 inline mr-1" />
        Payroll calculations are estimates based on current Kenya statutory rules. 
        You remain responsible for filing and remitting taxes.
      </p>
    );
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <p className="font-medium mb-1">Assisted Payroll Service</p>
        <p className="text-sm">
          Payroll calculations are estimates based on current Kenya statutory rules, 
          including PAYE, NSSF, and NHIF / Housing Levy. This is an assisted payroll service. 
          You remain responsible for filing and remitting taxes to the relevant authorities.
        </p>
      </AlertDescription>
    </Alert>
  );
}
