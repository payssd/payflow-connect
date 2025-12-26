import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is HesabPay and who is it for?',
    answer:
      'HesabPay is an all-in-one financial management platform designed for African businesses. It combines invoicing, payroll, expense tracking, and payment processing to help small and medium businesses manage their finances efficiently.',
  },
  {
    question: 'How does the pricing work?',
    answer:
      'We offer flexible pricing plans starting with a free Starter plan for small teams. Our Growth plan at KES 2,500/month and Pro plan at KES 5,000/month offer more features like unlimited invoices, advanced payroll, and priority support. All paid plans come with a 14-day free trial.',
  },
  {
    question: 'Is my financial data secure?',
    answer:
      'Absolutely. We use bank-level 256-bit SSL encryption, secure data centers, and comply with international security standards. Your data is backed up daily and we never share your information with third parties.',
  },
  {
    question: 'Which payment gateways do you support?',
    answer:
      'We currently support M-Pesa, Paystack, and direct bank transfers. This allows your customers to pay invoices using their preferred payment method, improving your collection rates.',
  },
  {
    question: 'Can I invite my team members?',
    answer:
      'Yes! Team collaboration features are coming soon. You will be able to invite team members with different roles (Owner, Admin, Member) to manage your business finances together.',
  },
  {
    question: 'How does the payroll system work with Kenyan taxes?',
    answer:
      'Our payroll system is fully compliant with Kenyan tax regulations. It automatically calculates PAYE, NHIF, NSSF, and Housing Levy based on current rates, generates payslips, and provides reports for statutory submissions.',
  },
  {
    question: 'Can I try HesabPay before committing?',
    answer:
      'Yes! You can start with our free Starter plan to explore the platform, or sign up for a 14-day free trial of any paid plan. No credit card required to get started.',
  },
  {
    question: 'How do I get support if I need help?',
    answer:
      'We offer email support for all users, with priority support and dedicated account managers for Pro plan subscribers. You can also access our help documentation and video tutorials anytime.',
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about HesabPay. Can't find your answer? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background rounded-lg border px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
