import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// These should match your Paystack plan codes exactly
// Create these plans in your Paystack dashboard first
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
    planCode: null, // Custom pricing - contact sales
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

export default function Subscription() {
  const { user, currentOrganization, refreshOrganizations } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // If user has active subscription, redirect to dashboard
  if (currentOrganization?.subscription_status === 'active') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    // Handle custom pricing (Pro plan)
    if ('isCustom' in plan && plan.isCustom) {
      window.location.href = 'mailto:sales@payflow.africa?subject=Pro Plan Inquiry';
      return;
    }

    if (!currentOrganization || !user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in and create an organization first.',
        variant: 'destructive',
      });
      return;
    }

    if (!plan.planCode) {
      toast({
        title: 'Plan not available',
        description: 'This plan requires custom pricing. Please contact sales.',
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
          amount: plan.price[billingPeriod], // Fallback amount if plan doesn't exist
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription failed',
        description: error.message || 'Failed to initialize subscription. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(null);
    }
  };

  const handleSkipForNow = async () => {
    // For demo purposes, activate with trialing status
    if (currentOrganization) {
      try {
        const { error } = await supabase
          .from('organizations')
          .update({
            subscription_status: 'trialing',
            subscription_plan: 'starter',
            subscription_started_at: new Date().toISOString(),
            subscription_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('id', currentOrganization.id);

        if (error) throw error;

        await refreshOrganizations();
        
        toast({
          title: '14-day trial activated!',
          description: 'You have full access to try all features.',
        });
        
        navigate('/dashboard');
      } catch (error: any) {
        console.error('Trial activation error:', error);
        toast({
          title: 'Error',
          description: 'Failed to activate trial. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-12 px-4">
        <div className="text-center space-y-4 mb-12 page-transition">
          <h1 className="text-4xl font-bold tracking-tight">
            Choose your plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a plan that fits your business. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-secondary p-1.5 rounded-full mt-6">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 bg-success/10 text-success">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative border-0 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-primary' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                  plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center pb-6">
                <div className="mb-6">
                  {'isCustom' in plan && plan.isCustom ? (
                    <span className="text-4xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        {formatPrice(plan.price[billingPeriod])}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading !== null}
                >
                  {isLoading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'isCustom' in plan && plan.isCustom ? (
                    'Contact Sales'
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 text-center">
          <Card className="border-0 shadow-card bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="py-8">
              <h3 className="text-xl font-bold mb-2">Need a custom solution?</h3>
              <p className="text-muted-foreground mb-4">
                Contact us for enterprise pricing with custom features and dedicated support.
              </p>
              <Button variant="outline">Contact Sales</Button>
            </CardContent>
          </Card>
        </div>

        {/* Skip for now (demo mode) */}
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            className="text-muted-foreground"
            onClick={handleSkipForNow}
          >
            Start 14-day free trial instead
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
          PayFlow Africa is a software tool. All payments flow directly through your connected payment providers. 
          We never hold, process, or custody your funds.
        </p>
      </div>
    </div>
  );
}
