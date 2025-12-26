import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Eye, Trash2, Wallet, Loader2, CheckCircle, Send } from 'lucide-react';
import { format } from 'date-fns';
import { formatKES } from '@/lib/kenyaTax';
import type { PayrollRun } from '@/hooks/usePayrollRuns';

interface PayrollListProps {
  payrollRuns: PayrollRun[];
  isLoading: boolean;
  onAddNew: () => void;
  onView: (run: PayrollRun) => void;
  onDelete: (id: string) => Promise<boolean>;
  onUpdateStatus: (id: string, status: string) => Promise<any>;
}

export function PayrollList({ payrollRuns, isLoading, onAddNew, onView, onDelete, onUpdateStatus }: PayrollListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await onDelete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

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

  if (isLoading) {
    return (
      <Card className="border-0 shadow-card">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Payroll Runs
            </CardTitle>
            <CardDescription>{payrollRuns.length} total payroll runs</CardDescription>
          </div>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Payroll Run
          </Button>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No payroll runs yet</h3>
              <p className="text-muted-foreground mb-4">Create your first payroll run to process salaries.</p>
              <Button onClick={onAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                New Payroll Run
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Run #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRuns.map((run) => (
                    <TableRow key={run.id} className="group cursor-pointer" onClick={() => onView(run)}>
                      <TableCell className="font-medium">{run.run_number}</TableCell>
                      <TableCell>{run.name}</TableCell>
                      <TableCell>
                        {format(new Date(run.pay_period_start), 'MMM d')} - {format(new Date(run.pay_period_end), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{run.employee_count} employees</TableCell>
                      <TableCell>{getStatusBadge(run.status)}</TableCell>
                      <TableCell className="text-right font-medium">{formatKES(Number(run.total_net))}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(run)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {run.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(run.id, 'approved')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {run.status === 'approved' && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(run.id, 'paid')}>
                                <Send className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {run.status === 'draft' && (
                              <DropdownMenuItem onClick={() => setDeleteId(run.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Run</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will delete all payslips in this run.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
