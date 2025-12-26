import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Building2, Download, Smartphone, Landmark, AlertCircle, CheckCircle2, Clock, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceData {
  invoice: {
    id: string;
    invoice_number: string;
    status: string;
    issue_date: string;
    due_date: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    amount_paid: number;
    currency: string;
    notes: string;
    terms: string;
    customer_name: string;
    customer_email: string;
    customer_address: string;
  };
  organization: {
    name: string;
    email: string;
    phone: string;
    country: string;
    logo_url: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  paymentMethods: {
    mpesa: {
      shortcode: string;
      account_name: string;
    } | null;
    bank: {
      bank_name: string;
      account_name: string;
      account_number: string;
      branch: string;
      swift_code: string;
    } | null;
  };
  onlinePayment: {
    paystack: boolean;
    flutterwave: boolean;
  };
}

export default function PublicInvoice() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvoice();
    }
    
    // Check for payment success/error in URL params
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast({ title: 'Payment Successful', description: 'Thank you for your payment!' });
    }
  }, [token]);

  const fetchInvoice = async () => {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('get-public-invoice', {
        body: null,
        headers: {},
      });
      
      // Use query params approach since we can't pass params to invoke easily
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-invoice?token=${token}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load invoice');
      }

      const invoiceData = await response.json();
      setData(invoiceData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load invoice';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data?.invoice?.currency || 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      paid: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Paid' },
      sent: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Awaiting Payment' },
      overdue: { variant: 'destructive', icon: <AlertCircle className="h-3 w-3" />, label: 'Overdue' },
      draft: { variant: 'outline', icon: <FileText className="h-3 w-3" />, label: 'Draft' },
      partial: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Partially Paid' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleOnlinePayment = async (provider: 'paystack' | 'flutterwave') => {
    if (!token) return;
    
    setPaymentLoading(provider);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initialize-invoice-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceToken: token,
            provider,
            callbackUrl: `${window.location.origin}/invoice/${token}?payment=success`,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initialize payment');
      }

      // Redirect to payment page
      window.location.href = result.paymentUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize payment';
      toast({ title: 'Payment Error', description: message, variant: 'destructive' });
    } finally {
      setPaymentLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invoice Not Found</CardTitle>
            <CardDescription>
              {error || 'This invoice link may be invalid or expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { invoice, organization, items, paymentMethods } = data;
  const balanceDue = invoice.total - (invoice.amount_paid || 0);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-card overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-info p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{organization.name}</h1>
                <p className="opacity-90">{organization.email}</p>
                {organization.phone && <p className="opacity-90">{organization.phone}</p>}
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold">INVOICE</h2>
                <p className="text-xl font-bold">{invoice.invoice_number}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bill To</p>
                <p className="font-semibold">{invoice.customer_name}</p>
                {invoice.customer_email && <p className="text-sm">{invoice.customer_email}</p>}
                {invoice.customer_address && <p className="text-sm text-muted-foreground">{invoice.customer_address}</p>}
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  {getStatusBadge(invoice.status)}
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Issue Date:</span> {formatDate(invoice.issue_date)}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Due Date:</span> {formatDate(invoice.due_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 px-2">{item.description}</td>
                      <td className="py-3 px-2 text-right">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-success">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-success">
                    <span>Amount Paid</span>
                    <span>-{formatCurrency(invoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Balance Due</span>
                    <span>{formatCurrency(balanceDue)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Online Payment Options */}
        {(data.onlinePayment?.paystack || data.onlinePayment?.flutterwave) && balanceDue > 0 && (
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pay Online
              </CardTitle>
              <CardDescription>Pay securely with your card or mobile money</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {data.onlinePayment.paystack && (
                <Button 
                  onClick={() => handleOnlinePayment('paystack')}
                  disabled={paymentLoading !== null}
                  className="flex-1 min-w-[140px]"
                >
                  {paymentLoading === 'paystack' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Pay with Paystack
                </Button>
              )}
              {data.onlinePayment.flutterwave && (
                <Button 
                  onClick={() => handleOnlinePayment('flutterwave')}
                  disabled={paymentLoading !== null}
                  variant="secondary"
                  className="flex-1 min-w-[140px]"
                >
                  {paymentLoading === 'flutterwave' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Pay with Flutterwave
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Payment Methods */}
        {(paymentMethods.mpesa || paymentMethods.bank) && balanceDue > 0 && (
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Manual Payment Options</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {paymentMethods.mpesa && (
                <div className="p-4 rounded-lg border bg-success/5 border-success/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="h-5 w-5 text-success" />
                    <h4 className="font-semibold">M-Pesa</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Till/Paybill:</span> {paymentMethods.mpesa.shortcode}</p>
                    <p><span className="text-muted-foreground">Account Name:</span> {paymentMethods.mpesa.account_name}</p>
                    <p className="text-xs text-muted-foreground mt-2">Use invoice number as reference: {invoice.invoice_number}</p>
                  </div>
                </div>
              )}
              {paymentMethods.bank && (
                <div className="p-4 rounded-lg border bg-info/5 border-info/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="h-5 w-5 text-info" />
                    <h4 className="font-semibold">Bank Transfer</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Bank:</span> {paymentMethods.bank.bank_name}</p>
                    <p><span className="text-muted-foreground">Account Name:</span> {paymentMethods.bank.account_name}</p>
                    <p><span className="text-muted-foreground">Account No:</span> {paymentMethods.bank.account_number}</p>
                    {paymentMethods.bank.branch && (
                      <p><span className="text-muted-foreground">Branch:</span> {paymentMethods.bank.branch}</p>
                    )}
                    {paymentMethods.bank.swift_code && (
                      <p><span className="text-muted-foreground">SWIFT:</span> {paymentMethods.bank.swift_code}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Use invoice number as reference: {invoice.invoice_number}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <Card className="border-0 shadow-card">
            <CardContent className="p-6 space-y-4">
              {invoice.notes && (
                <div>
                  <h4 className="font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-medium mb-1">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground">{invoice.terms}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          <p>Powered by PayFlow Africa</p>
          <p className="mt-1">We never hold, process, or custody your funds.</p>
        </div>
      </div>
    </div>
  );
}
