import { AlertTriangle, FileSpreadsheet, Clock, Shuffle, Lock } from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    title: 'Payroll errors',
    description: 'Manual calculations lead to mistakes and disputes'
  },
  {
    icon: FileSpreadsheet,
    title: 'Spreadsheet chaos',
    description: 'Excel-based payroll is error-prone and slow'
  },
  {
    icon: Clock,
    title: 'Payment follow-ups',
    description: 'Chasing payments wastes valuable time'
  },
  {
    icon: Shuffle,
    title: 'Too many channels',
    description: 'Managing M-Pesa, cards, and bank transfers separately'
  },
  {
    icon: Lock,
    title: 'Money lock-in',
    description: 'Forced into one provider with hidden fees'
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Payroll and payments shouldn't be this hard
          </h2>
          <p className="text-lg text-muted-foreground">
            Most growing businesses in East Africa face these challenges every day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-5 border border-border hover:border-border/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                <problem.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">
                {problem.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-lg text-foreground mt-10 max-w-xl mx-auto">
          You shouldn't have to choose between control and convenience.
        </p>
      </div>
    </section>
  );
}
