import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Shield, 
  Lock,
  Calculator,
  FileText,
  Users,
  CreditCard,
  UserPlus,
  Briefcase,
  AlertTriangle,
  Download,
  Send,
  Sparkles
} from 'lucide-react';
import { ALL_COUNTRIES, DEFAULT_COUNTRY, getCountryConfig } from '@/lib/countryConfig';
import { calculateTax, TaxCalculation } from '@/lib/kenyaTax';
import { format, addDays } from 'date-fns';

type OnboardingStep = 'organization' | 'choose-action' | 'payroll-setup' | 'invoice-setup' | 'payroll-preview' | 'invoice-preview' | 'next-steps';

interface EmployeeData {
  fullName: string;
  employmentType: 'employee' | 'contractor';
  grossSalary: number;
}

interface InvoiceData {
  customerName: string;
  amount: number;
  includeVat: boolean;
  dueDate: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, organizations, createOrganization, isLoading: authLoading, refreshOrganizations } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('organization');
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  
  // Step 1 - Organization
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [country] = useState(DEFAULT_COUNTRY);
  
  // Step 2 - Choice
  const [primaryAction, setPrimaryAction] = useState<'payroll' | 'invoice' | null>(null);
  
  // Step 3A - Payroll Setup
  const [payFrequency] = useState('monthly');
  const [employee, setEmployee] = useState<EmployeeData>({
    fullName: '',
    employmentType: 'employee',
    grossSalary: 0,
  });
  
  // Step 3B - Invoice Setup
  const [invoice, setInvoice] = useState<InvoiceData>({
    customerName: '',
    amount: 0,
    includeVat: true,
    dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  });

  // Calculated values
  const [payrollPreview, setPayrollPreview] = useState<TaxCalculation | null>(null);

  // If not logged in, redirect to auth
  if (!user && !authLoading) {
    return <Navigate to="/auth" replace />;
  }

  // If user already has organizations, redirect to dashboard
  if (organizations.length > 0 && currentStep === 'organization') {
    return <Navigate to="/dashboard" replace />;
  }

  const countryConfig = getCountryConfig(country);

  const handleCreateOrganization = async () => {
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
        description: 'Please enter your business email.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    const selectedCountry = ALL_COUNTRIES.find(c => c.code === country);
    
    const { data, error } = await createOrganization({
      name: orgName,
      email: orgEmail,
      country: selectedCountry?.name || 'Kenya',
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

    if (data) {
      setCreatedOrgId(data.id);
    }
    
    toast({
      title: 'Organization created! 🎉',
      description: 'Now let\'s set up your first workflow.',
    });
    
    setCurrentStep('choose-action');
  };

  const handleActionChoice = (action: 'payroll' | 'invoice') => {
    setPrimaryAction(action);
    setCurrentStep(action === 'payroll' ? 'payroll-setup' : 'invoice-setup');
  };

  const handlePayrollPreview = () => {
    if (!employee.fullName.trim()) {
      toast({
        title: 'Employee name required',
        description: 'Please enter the employee\'s full name.',
        variant: 'destructive',
      });
      return;
    }

    if (employee.grossSalary <= 0) {
      toast({
        title: 'Salary required',
        description: 'Please enter a valid gross salary.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate Kenya tax
    const calculation = calculateTax(employee.grossSalary);
    setPayrollPreview(calculation);
    setCurrentStep('payroll-preview');
  };

  const handleInvoicePreview = () => {
    if (!invoice.customerName.trim()) {
      toast({
        title: 'Customer name required',
        description: 'Please enter the customer name.',
        variant: 'destructive',
      });
      return;
    }

    if (invoice.amount <= 0) {
      toast({
        title: 'Amount required',
        description: 'Please enter a valid invoice amount.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep('invoice-preview');
  };

  const handleComplete = async () => {
    // Refresh organizations to get the new org
    await refreshOrganizations();
    navigate('/dashboard');
  };

  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const vatAmount = invoice.includeVat ? invoice.amount * 0.16 : 0;
  const invoiceTotal = invoice.amount + vatAmount;

  // Progress indicator
  const getStepNumber = () => {
    switch (currentStep) {
      case 'organization': return 1;
      case 'choose-action': return 2;
      case 'payroll-setup':
      case 'invoice-setup': return 3;
      case 'payroll-preview':
      case 'invoice-preview': return 4;
      case 'next-steps': return 5;
      default: return 1;
    }
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(getStepNumber() / totalSteps) * 100}%` }}
        />
      </div>

      <div className="container max-w-2xl mx-auto py-8 px-4 page-transition">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">PayFlow</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {getStepNumber()}</span>
            <span>/</span>
            <span>{totalSteps}</span>
          </div>
        </div>

        {/* Step 1: Organization Setup */}
        {currentStep === 'organization' && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Create Your Organization</CardTitle>
              <CardDescription className="text-base">
                Your organization settings determine payroll rules and tax calculations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    type="text"
                    placeholder="Acme Corporation Ltd"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-email">Business Email *</Label>
                  <Input
                    id="org-email"
                    type="email"
                    placeholder="finance@company.co.ke"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <div className="h-12 px-4 rounded-lg border bg-muted/50 flex items-center gap-3">
                    <span className="text-xl">🇰🇪</span>
                    <span className="font-medium">Kenya</span>
                    <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently available in Kenya only. More countries coming soon.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <div className="h-12 px-4 rounded-lg border bg-muted/50 flex items-center gap-3">
                    <span className="font-medium">KES</span>
                    <span className="text-muted-foreground">— Kenyan Shilling</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateOrganization} 
                className="w-full h-12" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Action */}
        {currentStep === 'choose-action' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold">What would you like to do first?</h1>
              <p className="text-muted-foreground">You can set up both anytime.</p>
            </div>

            <div className="grid gap-4">
              <Card 
                className="border-2 cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                onClick={() => handleActionChoice('payroll')}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calculator className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      🧮 Run Payroll
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Calculate PAYE, NSSF, NHIF and pay employees
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>

              <Card 
                className="border-2 cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                onClick={() => handleActionChoice('invoice')}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-success" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      🧾 Create an Invoice
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Bill customers with VAT support
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setCurrentStep('organization')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}

        {/* Step 3A: Payroll Setup */}
        {currentStep === 'payroll-setup' && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set Up Kenya Payroll</CardTitle>
              <CardDescription className="text-base">
                Configure your payroll and add your first employee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Payroll Basics */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Payroll Basics
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pay Frequency</Label>
                    <div className="h-12 px-4 rounded-lg border bg-muted/50 flex items-center">
                      <span className="font-medium">Monthly</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Month</Label>
                    <div className="h-12 px-4 rounded-lg border bg-muted/50 flex items-center">
                      <span className="font-medium">{format(new Date(), 'MMMM yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statutory Deductions */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Statutory Deductions (Pre-selected)
                </h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">PAYE</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">NSSF</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">NHIF / Housing Levy</span>
                  </div>
                </div>
              </div>

              {/* Legal Disclaimer */}
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Assisted Payroll Disclaimer</p>
                    <p className="text-xs text-muted-foreground">
                      We calculate deductions based on Kenya statutory rules. You are responsible for filing and remitting taxes to KRA, NHIF, and NSSF.
                    </p>
                  </div>
                </div>
              </div>

              {/* Add First Employee */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add First Employee
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emp-name">Full Name *</Label>
                    <Input
                      id="emp-name"
                      type="text"
                      placeholder="John Kamau"
                      value={employee.fullName}
                      onChange={(e) => setEmployee({ ...employee, fullName: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-type">Employment Type</Label>
                    <Select 
                      value={employee.employmentType} 
                      onValueChange={(v: 'employee' | 'contractor') => setEmployee({ ...employee, employmentType: v })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-salary">Gross Salary (KES) *</Label>
                    <Input
                      id="emp-salary"
                      type="number"
                      placeholder="100,000"
                      value={employee.grossSalary || ''}
                      onChange={(e) => setEmployee({ ...employee, grossSalary: parseFloat(e.target.value) || 0 })}
                      className="h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => setCurrentStep('choose-action')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1 h-12"
                  onClick={handlePayrollPreview}
                >
                  Preview Payroll
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3B: Invoice Setup */}
        {currentStep === 'invoice-setup' && (
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Create Your First Invoice</CardTitle>
              <CardDescription className="text-base">
                Bill your first customer in seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    type="text"
                    placeholder="ABC Company Ltd"
                    value={invoice.customerName}
                    onChange={(e) => setInvoice({ ...invoice, customerName: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-amount">Invoice Amount (KES) *</Label>
                  <Input
                    id="invoice-amount"
                    type="number"
                    placeholder="50,000"
                    value={invoice.amount || ''}
                    onChange={(e) => setInvoice({ ...invoice, amount: parseFloat(e.target.value) || 0 })}
                    className="h-12"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <Label htmlFor="vat-toggle" className="font-medium">Include VAT (16%)</Label>
                    <p className="text-xs text-muted-foreground">Standard Kenya VAT rate</p>
                  </div>
                  <Switch
                    id="vat-toggle"
                    checked={invoice.includeVat}
                    onCheckedChange={(checked) => setInvoice({ ...invoice, includeVat: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={invoice.dueDate}
                    onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => setCurrentStep('choose-action')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  className="flex-1 h-12"
                  onClick={handleInvoicePreview}
                >
                  Preview Invoice
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4A: Payroll Preview */}
        {currentStep === 'payroll-preview' && payrollPreview && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-semibold">Payroll Preview</h1>
              <p className="text-muted-foreground">Here's what {employee.fullName}'s payslip looks like</p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{employee.fullName}</CardTitle>
                    <CardDescription className="capitalize">{employee.employmentType}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Pay Period</p>
                    <p className="font-medium">{format(new Date(), 'MMMM yyyy')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Earnings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Earnings</h4>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Gross Pay</span>
                    <span className="font-semibold text-lg">{formatKES(payrollPreview.grossPay)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Statutory Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>PAYE</span>
                      <span className="text-destructive">- {formatKES(payrollPreview.paye)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>NSSF</span>
                      <span className="text-destructive">- {formatKES(payrollPreview.nssf)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>NHIF / Housing Levy</span>
                      <span className="text-destructive">- {formatKES(payrollPreview.nhif)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Net Pay</span>
                    <span className="font-bold text-2xl text-success">{formatKES(payrollPreview.netPay)}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center italic">
                  ⚠️ Estimated based on Kenya payroll rules. Verify before filing with KRA.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="h-12 gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="h-12 gap-2">
                <Users className="h-4 w-4" />
                Add More Employees
              </Button>
              <Button className="h-12 gap-2" onClick={() => setCurrentStep('next-steps')}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4B: Invoice Preview */}
        {currentStep === 'invoice-preview' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-semibold">Invoice Preview</h1>
              <p className="text-muted-foreground">Your invoice is ready to send</p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Invoice #INV-0001</CardTitle>
                    <CardDescription>Draft</CardDescription>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
                    Draft
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Bill To</p>
                  <p className="font-semibold text-lg">{invoice.customerName}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatKES(invoice.amount)}</span>
                  </div>
                  {invoice.includeVat && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>VAT (16%)</span>
                      <span className="font-medium">{formatKES(vatAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-2xl text-primary">{formatKES(invoiceTotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Due Date</span>
                  <span>{format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="h-12 gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" className="h-12 gap-2">
                <CreditCard className="h-4 w-4" />
                Connect Payments
              </Button>
              <Button className="h-12 gap-2" onClick={() => setCurrentStep('next-steps')}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Next Steps */}
        {currentStep === 'next-steps' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold">You're Almost Set 🎉</h1>
              <p className="text-muted-foreground">Complete these steps to get the most from PayFlow</p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Organization created</p>
                    <p className="text-sm text-muted-foreground">{orgName} is ready</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Add more employees</p>
                    <p className="text-sm text-muted-foreground">Build your team roster</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Connect payment provider</p>
                    <p className="text-sm text-muted-foreground">M-Pesa, Paystack, or bank transfer</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Invite your team</p>
                    <p className="text-sm text-muted-foreground">Add admins or accountants</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Run first payroll</p>
                    <p className="text-sm text-muted-foreground">Pay your employees this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-12 text-lg"
              onClick={handleComplete}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
