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
  CheckCircle,
  Repeat,
  Percent,
  Download,
  Building2
} from 'lucide-react';

const featureCategories = [
  {
    title: 'Kenya Payroll',
    description: 'Compliant with KRA regulations',
    icon: Calculator,
    features: [
      { icon: DollarSign, text: 'PAYE, NSSF, NHIF & Housing Levy' },
      { icon: Users, text: 'Employees & contractor support' },
      { icon: Receipt, text: 'Allowances, bonuses & deductions' },
      { icon: Clock, text: 'Monthly payroll runs' },
      { icon: Download, text: 'PDF & CSV payroll reports' },
      { icon: Building2, text: 'Summaries for accountants' },
    ]
  },
  {
    title: 'Professional Invoicing',
    description: 'Bill customers with ease',
    icon: FileText,
    features: [
      { icon: Zap, text: 'One-time & recurring invoices' },
      { icon: Percent, text: 'VAT (16%) toggle per invoice' },
      { icon: Receipt, text: 'Withholding tax support' },
      { icon: DollarSign, text: 'Partial payment tracking' },
      { icon: CheckCircle, text: 'Status: Draft, Sent, Paid, Partial' },
      { icon: Download, text: 'Invoice reports (CSV/PDF)' },
    ]
  },
  {
    title: 'Payment Integration',
    description: 'Use your existing providers',
    icon: CreditCard,
    features: [
      { icon: Shield, text: 'Bring your own payment gateways' },
      { icon: Building2, text: 'Bank transfers supported' },
      { icon: Zap, text: 'M-Pesa integration ready' },
      { icon: CreditCard, text: 'Card payment providers' },
      { icon: CheckCircle, text: 'Platform never holds funds' },
      { icon: DollarSign, text: 'Money flows directly to you' },
    ]
  },
  {
    title: 'Reports & Insights',
    description: 'Full visibility into your business',
    icon: PieChart,
    features: [
      { icon: BarChart3, text: 'Payroll summaries' },
      { icon: Clock, text: 'Invoice aging reports' },
      { icon: PieChart, text: 'Business cost visibility' },
      { icon: Repeat, text: 'Monthly trends & analytics' },
      { icon: Download, text: 'Export to PDF/Excel' },
      { icon: Building2, text: 'Accountant-ready formats' },
    ]
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <span>🇰🇪</span>
            Kenya-Focused Features
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Everything you need to run your Kenyan business
          </h2>
          <p className="text-lg text-muted-foreground">
            Built specifically for Kenyan SMEs with 20-100 employees. 
            Compliant payroll, professional invoicing, and seamless payments.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
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
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Features list */}
              <div className="p-5">
                <ul className="space-y-3">
                  {category.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3 text-sm">
                      <feature.icon className="w-4 h-4 text-success flex-shrink-0" />
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
