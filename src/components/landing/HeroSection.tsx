import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-background to-background" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-24 text-center">
        {/* Trust indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Trusted by growing East African businesses</span>
        </div>

        {/* Main headline - Clear, direct */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground mb-6 animate-fade-in max-w-4xl mx-auto leading-tight">
          Run Payroll. Send Invoices.
          <br />
          <span className="text-primary">Stay in Control.</span>
        </h1>

        {/* Sub-headline - Simple, honest */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in leading-relaxed">
          A simple way to manage payroll and collect payments for your business. 
          Use your existing payment providers. Your money goes directly to you.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in">
          <Button asChild size="lg" className="h-12 px-6 text-base font-medium rounded-lg">
            <Link to="/auth">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base font-medium rounded-lg">
            <a href="mailto:sales@payflow.africa?subject=Demo Request">
              <Play className="mr-2 h-4 w-4" />
              Book a Demo
            </a>
          </Button>
        </div>

        {/* Trust strip - Simple values */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in">
          <span>Built for East Africa</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-border" />
          <span>Secure by Design</span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-border" />
          <span>No Money Lock-In</span>
        </div>

        {/* Dashboard preview - Clean, functional */}
        <div className="mt-20 relative max-w-4xl mx-auto animate-fade-in">
          <div className="relative bg-card rounded-xl border border-border shadow-lg overflow-hidden">
            <div className="h-10 bg-muted/50 flex items-center gap-2 px-4 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
              <div className="w-3 h-3 rounded-full bg-border" />
              <span className="ml-4 text-xs text-muted-foreground">Dashboard</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Payroll', value: '$24,500' },
                  { label: 'Invoices Sent', value: '156' },
                  { label: 'Payments Received', value: '$89,420' },
                  { label: 'Active Employees', value: '42' },
                ].map((stat, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-xl font-semibold text-foreground tabular-nums">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
