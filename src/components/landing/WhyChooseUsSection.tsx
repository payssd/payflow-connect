import { Check } from 'lucide-react';

const reasons = [
  'No money custody — payments go directly to you',
  'No payment lock-in — use your preferred providers',
  'Built for East Africa — local tax compliance',
  'SME-friendly pricing — no hidden fees',
  'Secure and compliant by design',
];

export function WhyChooseUsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6">
                Designed for real African businesses
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We understand the unique challenges of running a business in East Africa. 
                That's why we built PayFlow differently.
              </p>

              <ul className="space-y-4">
                {reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground">
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-lg font-medium text-foreground">
                Payroll and payments, done right.
              </p>
            </div>

            {/* Right - Stats */}
            <div className="bg-card rounded-xl border border-border p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-semibold text-primary mb-1 tabular-nums">500+</p>
                  <p className="text-sm text-muted-foreground">Businesses</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-semibold text-primary mb-1 tabular-nums">$2M+</p>
                  <p className="text-sm text-muted-foreground">Payroll Processed</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-semibold text-primary mb-1 tabular-nums">10K+</p>
                  <p className="text-sm text-muted-foreground">Invoices Sent</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-semibold text-primary mb-1 tabular-nums">99.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
