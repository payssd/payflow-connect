import { Button } from '@/components/ui/button';
import { Check, Zap, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    price: '$10',
    period: '/month',
    description: 'For small teams',
    icon: Zap,
    features: [
      'Up to 10 employees',
      'Unlimited invoices',
      'Basic reports',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Growth',
    price: '$20',
    period: '/month',
    description: 'For growing businesses',
    icon: Sparkles,
    features: [
      'Up to 50 employees',
      'Advanced analytics',
      'Priority support',
      'Multiple gateways',
    ],
    popular: true,
  },
  {
    name: 'Pro',
    price: 'Custom',
    period: '',
    description: 'For enterprises',
    icon: Crown,
    features: [
      'Unlimited employees',
      'Dedicated support',
      'API access',
      'Custom integrations',
    ],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Plans for businesses of every size. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-lg border overflow-hidden ${
                plan.popular 
                  ? 'border-primary' 
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              )}
              
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 pt-8">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <plan.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                
                <div className="mb-6">
                  <span className="text-3xl font-semibold text-foreground tabular-nums">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <Button 
                  asChild 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link to="/subscription">
                    {plan.name === 'Pro' ? 'Contact Sales' : 'Get Started'}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="link" className="text-primary">
            <Link to="/subscription">
              View full pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
