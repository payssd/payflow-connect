import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  Check, 
  Sparkles, 
  Zap, 
  Crown, 
  ArrowRight, 
  Loader2, 
  Calendar,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  Receipt,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses just getting started',
    price: { monthly: 10, yearly: 100 },
    currency: 'USD',
    icon: Zap,
    planCode: 'PLN_04faggvrzaef1nv',
    features: [
      'Up to 10 employees',
      'Unlimited invoices',
      'Basic reports',
      'Email support',
      '1 payment gateway',
    ],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses that need more power',
    price: { monthly: 20, yearly: 200 },
    currency: 'USD',
    icon: Sparkles,
    planCode: 'PLN_h812vb0ofzt1n20',
    features: [
      'Up to 50 employees',
      'Unlimited invoices',
      'Advanced reports & analytics',
      'Priority email support',
      'Multiple payment gateways',
      'Custom invoice branding',
      'Bulk payroll processing',
    ],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For enterprises with advanced needs',
    price: { monthly: 0, yearly: 0 },
    currency: 'USD',
    icon: Crown,
    planCode: null,
    features: [
      'Unlimited employees',
      'Unlimited invoices',
      'Full analytics suite',
      'Dedicated support',
      'Unlimited payment gateways',
      'White-label invoices',
      'API access',
      'Custom integrations',
      'Audit logs',
    ],
    popular: false,
    isCustom: true,
  },
];

export default function SubscriptionManagement() {
  const { currentOrganization, refreshOrganizations } = useAuth();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const currentPlan = plans.find(p => p.id === currentOrganization?.subscription_plan) || null;
  const isActive = currentOrganization?.subscription_status === 'active';
  const isTrialing = currentOrganization?.subscription_status === 'trialing';
  const isPastDue = currentOrganization?.subscription_status === 'past_due';

  // Fetch billing history
  const { data: billingHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['billing-history', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleChangePlan = async (plan: typeof plans[0]) => {
    if ('isCustom' in plan && plan.isCustom) {
      window.location.href = 'mailto:sales@payflow.africa?subject=Pro Plan Inquiry';
      return;
    }

    if (!currentOrganization) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in first.',
        variant: 'destructive',
      });
      return;
    }

    if (!plan.planCode) {
      toast({
        title: 'Plan not available',
        description: 'This plan requires custom pricing.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          organizationId: currentOrganization.id,
          planCode: plan.planCode,
          email: currentOrganization.email,
          amount: plan.price[billingPeriod],
        },
      });

      if (error) throw new Error(error.message);

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to change plan',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      setIsLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentOrganization) return;
    
    setIsCancelling(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'cancelled',
          subscription_ends_at: new Date().toISOString(),
        })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      // Send cancellation email
      try {
        await supabase.functions.invoke('send-subscription-email', {
          body: {
            email: currentOrganization.email,
            organizationName: currentOrganization.name,
            type: 'cancelled',
          },
        });
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }

      await refreshOrganizations();

      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled. You can reactivate anytime.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to cancel',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentOrganization?.subscription_status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </div>
            {currentPlan && (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentPlan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
              }`}>
                <currentPlan.icon className="h-6 w-6" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold capitalize">
                {currentOrganization?.subscription_plan || 'No plan'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">
                {currentOrganization?.subscription_status || 'Inactive'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {isTrialing ? 'Trial Ends' : 'Next Billing'}
              </p>
              <p className="text-lg font-semibold">
                {currentOrganization?.subscription_ends_at
                  ? format(new Date(currentOrganization.subscription_ends_at), 'MMM d, yyyy')
                  : '—'}
              </p>
            </div>
          </div>

          {isPastDue && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Your payment is past due. Please update your payment method.</span>
            </div>
          )}

          {isTrialing && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                You're on a free trial. Upgrade to continue after your trial ends.
              </span>
            </div>
          )}
        </CardContent>
        {(isActive || isTrialing) && (
          <CardFooter className="flex gap-2 border-t pt-6">
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@payflow.africa">
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </a>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You'll lose access to premium features 
                    immediately. You can reactivate your subscription at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Yes, Cancel'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>

      {/* Billing History */}
      <Card className="border-0 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your recent subscription payments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : billingHistory && billingHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{payment.plan_name || 'Subscription'}</span>
                      {payment.billing_period && (
                        <span className="text-muted-foreground text-xs ml-1">
                          ({payment.billing_period})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatPrice(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                        className={payment.status === 'completed' ? 'bg-success/10 text-success border-success/20' : ''}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {payment.payment_reference?.slice(0, 12)}...
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No billing history yet</p>
              <p className="text-xs mt-1">Your payments will appear here once you subscribe</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isActive ? 'Change Plan' : 'Available Plans'}
          </h2>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 bg-secondary p-1 rounded-full">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-1 bg-success/10 text-success text-xs">
                -17%
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentOrganization?.subscription_plan;
            const isUpgrade = currentPlan 
              ? plans.indexOf(plan) > plans.indexOf(currentPlan)
              : true;

            return (
              <Card
                key={plan.id}
                className={`relative border-0 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                } ${isCurrentPlan ? 'bg-primary/5' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 text-xs">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center ${
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-4">
                  <div className="mb-4">
                    {'isCustom' in plan && plan.isCustom ? (
                      <span className="text-3xl font-bold">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">
                          {formatPrice(plan.price[billingPeriod])}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 text-left">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs">
                        <Check className="h-3 w-3 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-muted-foreground">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'secondary' : plan.popular ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangePlan(plan)}
                    disabled={isLoading !== null || isCurrentPlan}
                  >
                    {isLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : 'isCustom' in plan && plan.isCustom ? (
                      <>
                        Contact Sales
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </>
                    ) : isUpgrade ? (
                      <>
                        Upgrade
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </>
                    ) : (
                      'Downgrade'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ or Help */}
      <Card className="border-0 shadow-card bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="py-6 text-center">
          <h3 className="font-semibold mb-1">Need help with your subscription?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Contact our support team for billing questions or custom enterprise solutions.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@payflow.africa">Contact Support</a>
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        PayFlow Africa is a software tool. We never hold, process, or custody your funds.
      </p>
    </div>
  );
}
