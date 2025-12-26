import { 
  Calculator, 
  FileText, 
  CreditCard, 
  BarChart3,
  DollarSign,
  Users,
  Receipt,
  PieChart,
  Shield,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';

const featureCategories = [
  {
    title: 'Payroll Made Simple',
    icon: Calculator,
    features: [
      { icon: DollarSign, text: 'Salary calculations' },
      { icon: Users, text: 'Allowances & deductions' },
      { icon: FileText, text: 'PDF payslips' },
      { icon: BarChart3, text: 'Payroll reports' },
    ]
  },
  {
    title: 'Professional Invoicing',
    icon: Receipt,
    features: [
      { icon: Zap, text: 'Create invoices in minutes' },
      { icon: FileText, text: 'Send via email or WhatsApp' },
      { icon: CheckCircle, text: 'Track paid & unpaid invoices' },
      { icon: Clock, text: 'Automated reminders' },
    ]
  },
  {
    title: 'Payment Orchestration',
    icon: CreditCard,
    features: [
      { icon: Shield, text: 'Bring your own gateways' },
      { icon: CheckCircle, text: 'No locked-in provider' },
      { icon: DollarSign, text: 'Payments go directly to you' },
      { icon: Zap, text: 'Real-time tracking' },
    ]
  },
  {
    title: 'Clear Reports',
    icon: PieChart,
    features: [
      { icon: BarChart3, text: 'Payroll summaries' },
      { icon: Clock, text: 'Invoice aging reports' },
      { icon: PieChart, text: 'Business cost visibility' },
      { icon: FileText, text: 'Export to PDF/Excel' },
    ]
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Everything you need to run your business
          </h2>
          <p className="text-lg text-muted-foreground">
            Simple, powerful features designed for East African businesses.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {featureCategories.map((category, index) => (
            <div
              key={index}
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    {category.title}
                  </h3>
                </div>
              </div>
              
              {/* Features list */}
              <div className="p-5">
                <ul className="space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3 text-sm">
                      <feature.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
