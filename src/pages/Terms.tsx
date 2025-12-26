import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">PayFlow Africa</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <Card className="border-0 shadow-card">
          <CardContent className="p-8 md:p-12">
            <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 25, 2024</p>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using PayFlow Africa ("Service"), you accept and agree to be bound by the terms and 
                  provisions of this agreement. If you do not agree to these terms, please do not use our Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  PayFlow Africa is a payroll and invoicing software tool designed to help businesses manage their 
                  employee payments and customer invoices. Our platform provides:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Employee management and payroll processing tools</li>
                  <li>Invoice creation and management</li>
                  <li>Expense tracking and reporting</li>
                  <li>Integration with payment gateways (user-configured)</li>
                  <li>Business analytics and reporting</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">3. Important Disclaimer: No Money Handling</h2>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <p className="text-foreground font-medium">
                    PayFlow Africa is a software tool ONLY. We do NOT hold, process, transfer, or custody any funds. 
                    All actual payment transactions occur directly between you and your chosen payment providers 
                    (banks, M-Pesa, Paystack, etc.). We simply help you organize and track your financial operations.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">4. User Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed">As a user of our Service, you agree to:</p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Provide accurate and complete information when creating your account</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Comply with all applicable laws and regulations, including tax and employment laws</li>
                  <li>Not use the Service for any illegal or unauthorized purpose</li>
                  <li>Ensure proper configuration of payment gateway credentials</li>
                  <li>Verify all payroll calculations before processing payments</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Data Privacy and Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We take data security seriously. Your data is encrypted and stored securely. We do not sell or 
                  share your data with third parties except as necessary to provide the Service. For more details, 
                  please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Subscription and Payments</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Access to certain features requires a paid subscription. Subscription fees are billed in advance 
                  on a monthly or annual basis. You may cancel your subscription at any time, but refunds are not 
                  provided for partial billing periods.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  PayFlow Africa shall not be liable for any indirect, incidental, special, consequential, or 
                  punitive damages resulting from your use of the Service. This includes, but is not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Errors in payroll calculations (you are responsible for verification)</li>
                  <li>Failed payment transactions (handled by your payment providers)</li>
                  <li>Tax compliance issues</li>
                  <li>Data loss due to user error</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Service Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the Service. 
                  We may perform maintenance or updates that temporarily affect availability.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. Modifications to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of significant 
                  changes via email or through the Service. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These terms shall be governed by and construed in accordance with the laws of Kenya. Any disputes 
                  shall be resolved in the courts of Nairobi, Kenya.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:legal@payflow.africa" className="text-primary hover:underline">
                    legal@payflow.africa
                  </a>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 PayFlow Africa. All rights reserved.</p>
          <p className="mt-2">
            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
            {' · '}
            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
