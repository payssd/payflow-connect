import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function Privacy() {
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
            <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 25, 2024</p>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  PayFlow Africa ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our payroll 
                  and invoicing software service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium mb-2 mt-4">2.1 Information You Provide</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Account information (name, email, phone number)</li>
                  <li>Organization details (business name, address, tax information)</li>
                  <li>Employee data (names, salaries, bank details, tax IDs)</li>
                  <li>Customer information (names, emails, addresses)</li>
                  <li>Invoice and payment records</li>
                </ul>

                <h3 className="text-lg font-medium mb-2 mt-4">2.2 Automatically Collected Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and preferences</li>
                  <li>Log data and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed">We use collected information to:</p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Provide and maintain our Service</li>
                  <li>Process payroll calculations and generate invoices</li>
                  <li>Send important notifications and updates</li>
                  <li>Improve and optimize our Service</li>
                  <li>Provide customer support</li>
                  <li>Comply with legal obligations</li>
                  <li>Detect and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do NOT sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our Service 
                    (hosting, email delivery, analytics)</li>
                  <li><strong>Payment Processors:</strong> When you configure payment gateways, your payment provider 
                    receives necessary transaction data</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your data:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                  <li>Secure authentication mechanisms</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and role-based permissions</li>
                  <li>Secure data centers with physical security</li>
                </ul>
                <div className="bg-info/10 border border-info/20 rounded-lg p-4 mt-4">
                  <p className="text-foreground">
                    <strong>Note:</strong> Sensitive data such as bank account numbers and API keys are encrypted 
                    and stored securely. We never display full bank account numbers in the interface.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your data for as long as your account is active or as needed to provide services. 
                  After account deletion:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Personal data is deleted within 30 days</li>
                  <li>Financial records may be retained for 7 years for legal compliance</li>
                  <li>Anonymized analytics data may be retained indefinitely</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                  <li><strong>Deletion:</strong> Request deletion of your data</li>
                  <li><strong>Portability:</strong> Request your data in a portable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  To exercise these rights, contact us at{' '}
                  <a href="mailto:privacy@payflow.africa" className="text-primary hover:underline">
                    privacy@payflow.africa
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Cookies and Tracking</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use essential cookies for authentication and session management. We may also use analytics 
                  cookies to understand how users interact with our Service. You can control cookie preferences 
                  through your browser settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your data may be processed in countries other than your own. We ensure appropriate safeguards 
                  are in place for international transfers, including standard contractual clauses.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Service is not intended for children under 18. We do not knowingly collect personal 
                  information from children. If you believe we have collected such information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes 
                  via email or through the Service. Your continued use after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <ul className="list-none text-muted-foreground mt-2 space-y-1">
                  <li><strong>Email:</strong>{' '}
                    <a href="mailto:privacy@payflow.africa" className="text-primary hover:underline">
                      privacy@payflow.africa
                    </a>
                  </li>
                  <li><strong>Address:</strong> Nairobi, Kenya</li>
                </ul>
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
