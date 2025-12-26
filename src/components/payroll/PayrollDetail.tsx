import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import { formatKES } from '@/lib/kenyaTax';
import { downloadPayslipPdf } from '@/lib/payslipPdf';
import { useAuth } from '@/contexts/AuthContext';
import type { PayrollRun, PayrollRunWithItems } from '@/hooks/usePayrollRuns';
interface PayrollDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollRun: PayrollRun | null;
  getPayrollRunWithItems: (id: string) => Promise<PayrollRunWithItems | null>;
  onUpdateStatus: (id: string, status: string) => Promise<any>;
}

export function PayrollDetail({ open, onOpenChange, payrollRun, getPayrollRunWithItems, onUpdateStatus }: PayrollDetailProps) {
  const { currentOrganization } = useAuth();
  const [runWithItems, setRunWithItems] = useState<PayrollRunWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownloadPayslip = (item: PayrollRunWithItems['items'][0]) => {
    if (!currentOrganization || !payrollRun || !item.employee) return;

    downloadPayslipPdf(
      {
        name: currentOrganization.name,
        email: currentOrganization.email,
        phone: currentOrganization.phone,
        address: (currentOrganization as any).address || null,
        country: currentOrganization.country,
      },
      {
        first_name: item.employee.first_name,
        last_name: item.employee.last_name,
        employee_number: item.employee.employee_number,
        job_title: item.employee.job_title,
        department: item.employee.department,
        kra_pin: item.employee.kra_pin,
        nhif_number: item.employee.nhif_number,
        nssf_number: item.employee.nssf_number,
      },
      {
        run_number: payrollRun.run_number,
        name: payrollRun.name,
        pay_period_start: payrollRun.pay_period_start,
        pay_period_end: payrollRun.pay_period_end,
        payment_date: payrollRun.payment_date,
      },
      {
        basic_salary: Number(item.basic_salary),
        housing_allowance: item.housing_allowance,
        transport_allowance: item.transport_allowance,
        other_allowances: item.other_allowances,
        gross_pay: Number(item.gross_pay),
        paye: item.paye,
        nhif: item.nhif,
        nssf: item.nssf,
        housing_levy: item.housing_levy,
        other_deductions: item.other_deductions,
        total_deductions: item.total_deductions,
        net_pay: Number(item.net_pay),
      }
    );
  };

  useEffect(() => {
    if (open && payrollRun) {
      setIsLoading(true);
      getPayrollRunWithItems(payrollRun.id).then((data) => {
        setRunWithItems(data);
        setIsLoading(false);
      });
    }
  }, [open, payrollRun?.id]);

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      approved: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      paid: 'bg-success/10 text-success',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return (
      <Badge className={`border-0 ${styles[status || 'draft']}`}>
        {status?.charAt(0).toUpperCase() + (status?.slice(1) || '')}
      </Badge>
    );
  };

  if (!payrollRun) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {payrollRun.run_number} - {payrollRun.name}
            {getStatusBadge(payrollRun.status)}
          </DialogTitle>
          <DialogDescription>
            Pay period: {format(new Date(payrollRun.pay_period_start), 'MMM d')} - {format(new Date(payrollRun.pay_period_end), 'MMM d, yyyy')}
            {payrollRun.payment_date && (
              <>{' • '}Payment date: {format(new Date(payrollRun.payment_date), 'MMM d, yyyy')}</>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Gross Pay</p>
                  <p className="text-xl font-bold">{formatKES(Number(payrollRun.total_gross))}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total PAYE</p>
                  <p className="text-xl font-bold text-destructive">{formatKES(Number(payrollRun.total_paye))}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">NHIF + NSSF</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatKES(Number(payrollRun.total_nhif) + Number(payrollRun.total_nssf))}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-primary/10">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Net Pay</p>
                  <p className="text-xl font-bold text-primary">{formatKES(Number(payrollRun.total_net))}</p>
                </CardContent>
              </Card>
            </div>

            {/* Employee Payslips Table */}
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Payslips ({runWithItems?.items?.length || 0} employees)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">PAYE</TableHead>
                        <TableHead className="text-right">NHIF</TableHead>
                        <TableHead className="text-right">NSSF</TableHead>
                        <TableHead className="text-right">Net Pay</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runWithItems?.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.employee?.first_name} {item.employee?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.employee?.job_title || item.employee?.department || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatKES(Number(item.gross_pay))}</TableCell>
                          <TableCell className="text-right text-destructive">{formatKES(Number(item.paye))}</TableCell>
                          <TableCell className="text-right text-destructive">{formatKES(Number(item.nhif))}</TableCell>
                          <TableCell className="text-right text-destructive">{formatKES(Number(item.nssf))}</TableCell>
                          <TableCell className="text-right font-medium text-success">{formatKES(Number(item.net_pay))}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPayslip(item)}
                              title="Download Payslip"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {payrollRun.status === 'draft' && (
                <Button onClick={() => onUpdateStatus(payrollRun.id, 'approved')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Payroll
                </Button>
              )}
              {payrollRun.status === 'approved' && (
                <Button onClick={() => onUpdateStatus(payrollRun.id, 'paid')}>
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
