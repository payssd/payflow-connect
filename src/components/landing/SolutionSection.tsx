import { Check, Calculator, FileText, CreditCard, TrendingUp } from 'lucide-react';

const solutions = [
  {
    icon: Calculator,
    title: 'Run accurate payroll every month',
    description: 'Automated calculations with local tax compliance'
  },
  {
    icon: FileText,
    title: 'Generate payslips in seconds',
    description: 'Professional PDF payslips with one click'
  },
  {
    icon: CreditCard,
    title: 'Create professional invoices',
    description: 'Clean invoices that get you paid faster'
  },
  {
    icon: TrendingUp,
    title: 'Get paid using providers you trust',
    description: 'M-Pesa, Paystack, Flutterwave, and more'
  },
];

export function SolutionSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            One platform. Total clarity.
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage payroll and payments — without holding your funds.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-card rounded-lg p-5 border border-border"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <solution.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground mb-1 flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  {solution.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {solution.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
