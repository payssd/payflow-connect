import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FinalCTASection() {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-primary-foreground mb-4">
            Run payroll and payments with confidence
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Join growing East African businesses using one platform to manage payroll, 
            invoices, and payments — without giving up control.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              asChild 
              size="lg" 
              className="h-12 px-6 text-base font-medium rounded-lg bg-white text-primary hover:bg-white/90"
            >
              <Link to="/auth">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="h-12 px-6 text-base font-medium rounded-lg border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10"
            >
              <a href="mailto:sales@payflow.africa?subject=Demo Request">
                <Play className="mr-2 h-4 w-4" />
                Book a Demo
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
