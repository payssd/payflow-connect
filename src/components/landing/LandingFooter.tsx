import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-semibold mb-3">PayFlow</h3>
            <p className="text-background/60 text-sm">
              Simple payroll and payments for East African businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-medium mb-3 text-background/80">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/subscription" className="text-background/60 hover:text-background transition-colors">Pricing</Link></li>
              <li><a href="#features" className="text-background/60 hover:text-background transition-colors">Features</a></li>
              <li><a href="#security" className="text-background/60 hover:text-background transition-colors">Security</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium mb-3 text-background/80">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:hello@payflow.africa" className="text-background/60 hover:text-background transition-colors">About</a></li>
              <li><a href="mailto:support@payflow.africa" className="text-background/60 hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium mb-3 text-background/80">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-background/60 hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-background/60 hover:text-background transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/10 pt-8">
          {/* Disclaimer */}
          <div className="bg-background/5 rounded-lg p-4 mb-6">
            <p className="text-xs text-background/50 text-center">
              This platform is a software service and does not process, hold, or transmit funds. 
              Payments are handled directly by third-party providers connected by the user. 
              PayFlow Africa is a software tool. All payments flow directly through your connected payment providers.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50">
            <p>© {new Date().getFullYear()} PayFlow Africa. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="mailto:support@payflow.africa" className="hover:text-background transition-colors">
                support@payflow.africa
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
