import { UserPlus, Link2, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: UserPlus,
    title: 'Subscribe',
    description: 'Choose a plan and activate your account. No lengthy onboarding required.'
  },
  {
    number: '2',
    icon: Link2,
    title: 'Connect your gateways',
    description: 'Use Paystack, Flutterwave, M-Pesa, or bank transfers. Your existing accounts work.'
  },
  {
    number: '3',
    icon: BarChart3,
    title: 'Run payroll & collect',
    description: 'Pay employees, send invoices, and track payments from one dashboard.'
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Get started in three steps
          </h2>
          <p className="text-lg text-muted-foreground">
            From signup to your first payroll run in under 10 minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-px bg-border z-0" style={{ width: 'calc(100% - 3rem)', left: 'calc(50% + 1.5rem)' }} />
              )}
              
              <div className="relative bg-card rounded-lg p-6 border border-border text-center">
                {/* Step number */}
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mx-auto mb-4">
                  {step.number}
                </div>
                
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
