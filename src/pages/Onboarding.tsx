import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

const countries = [
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, organizations, createOrganization, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [country, setCountry] = useState('Kenya');

  // If not logged in, redirect to auth
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has organizations, redirect to dashboard
  if (organizations.length > 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      toast({
        title: 'Organization name required',
        description: 'Please enter your organization name.',
        variant: 'destructive',
      });
      return;
    }

    if (!orgEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your organization email.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await createOrganization({
      name: orgName,
      email: orgEmail,
      phone: orgPhone || undefined,
      country,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Failed to create organization',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Organization created',
      description: 'Your workspace is ready. Let\'s get started.',
    });
    
    navigate('/subscription');
  };

  const features = [
    'Accurate payroll calculations',
    'Professional invoice generation',
    'Payment gateway integration',
    'Clear reports and insights',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-lg space-y-8 page-transition">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">PayFlow</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Set up your organization</h1>
            <p className="text-muted-foreground">
              Create your workspace to start managing payroll and invoices.
            </p>
          </div>

          <Card className="border shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Organization details
              </CardTitle>
              <CardDescription>
                This information appears on invoices and payslips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    type="text"
                    placeholder="Acme Corporation Ltd"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-email">Business Email *</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="finance@acme.co.ke"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone Number</Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    placeholder="+254 700 123 456"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country" className="h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-11 mt-6" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create Organization
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Features */}
      <div className="hidden lg:flex lg:w-1/2 brand-gradient p-12 flex-col justify-center relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">
              Everything you need to run your business
            </h2>
            <p className="text-base text-white/70 leading-relaxed">
              Powerful tools for payroll, invoicing, and payment management—designed for African businesses.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 bg-white/10 backdrop-blur px-5 py-4 rounded-xl"
              >
                <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
                <span className="text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-white/50 text-sm pt-4">
            <Shield className="w-4 h-4" />
            <span>We never hold, process, or touch your money.</span>
          </div>
        </div>
      </div>
    </div>
  );
}