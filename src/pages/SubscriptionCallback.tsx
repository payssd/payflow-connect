import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type VerificationStatus = 'verifying' | 'success' | 'failed';

export default function SubscriptionCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshOrganizations } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const ref = reference || trxref;

      if (!ref) {
        setStatus('failed');
        setErrorMessage('No payment reference found');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('paystack-verify', {
          body: null,
          headers: {},
        });

        // Use query params for the verify function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-verify?reference=${ref}`
        );
        
        const verifyData = await response.json();

        if (verifyData.success) {
          setStatus('success');
          await refreshOrganizations();
          toast({
            title: 'Subscription activated!',
            description: 'Welcome to PayFlow Africa. Your subscription is now active.',
          });
        } else {
          setStatus('failed');
          setErrorMessage(verifyData.message || verifyData.error || 'Payment verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('failed');
        setErrorMessage(error.message || 'Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams, refreshOrganizations, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-card">
        {status === 'verifying' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>
                Please wait while we confirm your subscription...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <CardTitle className="text-success">Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription has been activated. Welcome to PayFlow Africa!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {status === 'failed' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Payment Failed</CardTitle>
              <CardDescription>
                {errorMessage || 'There was an issue processing your payment.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => navigate('/subscription')} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
