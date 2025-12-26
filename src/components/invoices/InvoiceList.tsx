import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Search, Plus, MoreHorizontal, Eye, Trash2, FileText, Loader2, Send, CheckCircle, Download, Mail, Link2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceWithItems } from '@/hooks/useInvoices';

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
  onAddNew: () => void;
  onView: (invoice: Invoice) => void;
  onDelete: (id: string) => Promise<boolean>;
  onUpdateStatus: (id: string, status: string) => Promise<any>;
  onDownloadPdf: (invoice: Invoice) => Promise<void>;
  onSendEmail: (invoice: Invoice) => Promise<void>;
}

export function InvoiceList({ invoices, isLoading, onAddNew, onView, onDelete, onUpdateStatus, onDownloadPdf, onSendEmail }: InvoiceListProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const search = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(search) ||
      inv.customer_name?.toLowerCase().includes(search)
    );
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await onDelete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      await onDownloadPdf(invoice);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    setSendingEmailId(invoice.id);
    try {
      await onSendEmail(invoice);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleCopyPaymentLink = async (invoice: Invoice) => {
    if (!invoice.public_token) {
      toast({ title: 'Error', description: 'Invoice does not have a public link', variant: 'destructive' });
      return;
    }
    const paymentUrl = `${window.location.origin}/invoice/${invoice.public_token}`;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast({ title: 'Copied!', description: 'Payment link copied to clipboard' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleOpenPaymentLink = (invoice: Invoice) => {
    if (!invoice.public_token) {
      toast({ title: 'Error', description: 'Invoice does not have a public link', variant: 'destructive' });
      return;
    }
    const paymentUrl = `${window.location.origin}/invoice/${invoice.public_token}`;
    window.open(paymentUrl, '_blank');
  };

  const formatCurrency = (amount: number | null) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      paid: 'bg-success/10 text-success',
      partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      overdue: 'bg-destructive/10 text-destructive',
      cancelled: 'bg-muted text-muted-foreground line-through',
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
              <FileText className="h-5 w-5 text-primary" />
              Invoices
            </CardTitle>
            <CardDescription>{invoices.length} total invoices</CardDescription>
          </div>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search.' : 'Create your first invoice to get started.'}
              </p>
              {!searchQuery && (
                <Button onClick={onAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group cursor-pointer" onClick={() => onView(invoice)}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer_name || '-'}</TableCell>
                      <TableCell>{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(invoice.total))}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(invoice)} disabled={downloadingId === invoice.id}>
                              {downloadingId === invoice.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-2" />
                              )}
                              Download PDF
                            </DropdownMenuItem>
                            {invoice.customer_email && (
                              <DropdownMenuItem 
                                onClick={() => handleSendEmail(invoice)} 
                                disabled={sendingEmailId === invoice.id}
                              >
                                {sendingEmailId === invoice.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4 mr-2" />
                                )}
                                Send Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {invoice.public_token && invoice.status !== 'paid' && (
                              <>
                                <DropdownMenuItem onClick={() => handleCopyPaymentLink(invoice)}>
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Copy Payment Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenPaymentLink(invoice)}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open Payment Page
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(invoice.id, 'sent')}>
                                <Send className="h-4 w-4 mr-2" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'partial') && (
                              <DropdownMenuItem onClick={() => onUpdateStatus(invoice.id, 'paid')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(invoice.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
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
