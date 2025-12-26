import { Shield, Lock, Eye, FileCheck } from 'lucide-react';

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encrypted data',
    description: 'All data encrypted in transit and at rest'
  },
  {
    icon: Eye,
    title: 'Role-based access',
    description: 'Control who sees what in your team'
  },
  {
    icon: FileCheck,
    title: 'Full audit logs',
    description: 'Track every action for compliance'
  },
];

export function SecuritySection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Your money stays with you
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We take security seriously. Your data is protected, and your funds never pass through us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-lg p-5 border border-border text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Important notice */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-base font-medium text-foreground mb-1">
                  We Never Hold Your Funds
                </h4>
                <p className="text-muted-foreground text-sm">
                  We do not process or hold funds. All payments are handled directly by your connected payment providers. 
                  Your money goes straight to your accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
