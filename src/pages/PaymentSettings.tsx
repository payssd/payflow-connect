import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smartphone, Building2, Save, CreditCard, Shield, ExternalLink, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface PaymentSettings {
  id?: string;
  organization_id: string;
  mpesa_enabled: boolean;
  mpesa_business_shortcode: string;
  mpesa_account_name: string;
  bank_enabled: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_swift_code: string;
}

interface GatewayConfig {
  id?: string;
  provider: string;
  is_enabled: boolean;
  is_live_mode: boolean;
  public_key: string;
  secret_key_hint: string;
  webhook_secret_hint: string;
}

export default function PaymentSettings() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual payment settings
  const [settings, setSettings] = useState<PaymentSettings>({
    organization_id: '',
    mpesa_enabled: false,
    mpesa_business_shortcode: '',
    mpesa_account_name: '',
    bank_enabled: false,
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_branch: '',
    bank_swift_code: '',
  });

  // Gateway configs
  const [paystackConfig, setPaystackConfig] = useState({
    isEnabled: false,
    isLiveMode: false,
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    secretKeyHint: '',
    webhookSecretHint: '',
  });

  const [flutterwaveConfig, setFlutterwaveConfig] = useState({
    isEnabled: false,
    isLiveMode: false,
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    secretKeyHint: '',
    webhookSecretHint: '',
  });

  const [showSecrets, setShowSecrets] = useState({
    paystackSecret: false,
    paystackWebhook: false,
    flutterwaveSecret: false,
    flutterwaveWebhook: false,
  });

  useEffect(() => {
    if (currentOrganization) {
      fetchSettings();
    }
  }, [currentOrganization]);

  const fetchSettings = async () => {
    if (!currentOrganization) return;
    
    setIsLoading(true);
    
    // Fetch manual payment settings
    const { data: paymentData } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('organization_id', currentOrganization.id)
      .maybeSingle();

    if (paymentData) {
      setSettings({
        ...paymentData,
        mpesa_business_shortcode: paymentData.mpesa_business_shortcode || '',
        mpesa_account_name: paymentData.mpesa_account_name || '',
        bank_name: paymentData.bank_name || '',
        bank_account_name: paymentData.bank_account_name || '',
        bank_account_number: paymentData.bank_account_number || '',
        bank_branch: paymentData.bank_branch || '',
        bank_swift_code: paymentData.bank_swift_code || '',
      });
    } else {
      setSettings(prev => ({
        ...prev,
        organization_id: currentOrganization.id,
      }));
    }

    // Fetch gateway configs
    const { data: gatewayData } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('organization_id', currentOrganization.id);

    if (gatewayData) {
      const paystack = gatewayData.find(g => g.provider === 'paystack');
      const flutterwave = gatewayData.find(g => g.provider === 'flutterwave');

      if (paystack) {
        setPaystackConfig({
          isEnabled: paystack.is_enabled,
          isLiveMode: paystack.is_live_mode,
          publicKey: paystack.public_key || '',
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: paystack.secret_key_hint || '',
          webhookSecretHint: paystack.webhook_secret_hint || '',
        });
      }

      if (flutterwave) {
        setFlutterwaveConfig({
          isEnabled: flutterwave.is_enabled,
          isLiveMode: flutterwave.is_live_mode,
          publicKey: flutterwave.public_key || '',
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: flutterwave.secret_key_hint || '',
          webhookSecretHint: flutterwave.webhook_secret_hint || '',
        });
      }
    }

    setIsLoading(false);
  };

  const handleSaveManual = async () => {
    if (!currentOrganization) return;

    setIsSaving(true);
    
    const payload = {
      organization_id: currentOrganization.id,
      mpesa_enabled: settings.mpesa_enabled,
      mpesa_business_shortcode: settings.mpesa_business_shortcode || null,
      mpesa_account_name: settings.mpesa_account_name || null,
      bank_enabled: settings.bank_enabled,
      bank_name: settings.bank_name || null,
      bank_account_name: settings.bank_account_name || null,
      bank_account_number: settings.bank_account_number || null,
      bank_branch: settings.bank_branch || null,
      bank_swift_code: settings.bank_swift_code || null,
    };

    let error;
    if (settings.id) {
      const result = await supabase
        .from('payment_settings')
        .update(payload)
        .eq('id', settings.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('payment_settings')
        .insert(payload)
        .select()
        .single();
      error = result.error;
      if (result.data) {
        setSettings(prev => ({ ...prev, id: result.data.id }));
      }
    }

    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings saved',
        description: 'Your payment settings have been updated.',
      });
    }
  };

  const handleSaveGateway = async (provider: 'paystack' | 'flutterwave') => {
    if (!currentOrganization) return;

    setIsSaving(true);
    const config = provider === 'paystack' ? paystackConfig : flutterwaveConfig;

    try {
      const { data, error } = await supabase.functions.invoke('save-gateway-config', {
        body: {
          organizationId: currentOrganization.id,
          provider,
          publicKey: config.publicKey,
          secretKey: config.secretKey,
          webhookSecret: config.webhookSecret,
          isEnabled: config.isEnabled,
          isLiveMode: config.isLiveMode,
        },
      });

      if (error) throw error;

      toast({
        title: 'Gateway configured',
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} settings saved successfully.`,
      });

      // Clear sensitive fields after save
      if (provider === 'paystack') {
        setPaystackConfig(prev => ({
          ...prev,
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: data.config.secretKeyHint || prev.secretKeyHint,
          webhookSecretHint: data.config.webhookSecretHint || prev.webhookSecretHint,
        }));
      } else {
        setFlutterwaveConfig(prev => ({
          ...prev,
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: data.config.secretKeyHint || prev.secretKeyHint,
          webhookSecretHint: data.config.webhookSecretHint || prev.webhookSecretHint,
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save gateway config';
      toast({
        title: 'Error saving gateway',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
        <p className="text-muted-foreground">
          Configure how you collect payments from customers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="manual">Manual Payments</TabsTrigger>
          <TabsTrigger value="automated">Automated Collection</TabsTrigger>
        </TabsList>

        {/* Manual Payment Methods */}
        <TabsContent value="manual" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={handleSaveManual} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          {/* M-Pesa Settings */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle>M-Pesa</CardTitle>
                    <CardDescription>Accept mobile money payments</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.mpesa_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, mpesa_enabled: checked }))}
                />
              </div>
            </CardHeader>
            {settings.mpesa_enabled && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mpesa-shortcode">Business Shortcode / Till Number</Label>
                    <Input
                      id="mpesa-shortcode"
                      placeholder="e.g., 174379"
                      value={settings.mpesa_business_shortcode}
                      onChange={(e) => setSettings(prev => ({ ...prev, mpesa_business_shortcode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mpesa-name">Account Name</Label>
                    <Input
                      id="mpesa-name"
                      placeholder="e.g., Acme Corporation"
                      value={settings.mpesa_account_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, mpesa_account_name: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This information will be displayed on invoices so customers know where to send payments.
                </p>
              </CardContent>
            )}
          </Card>

          {/* Bank Transfer Settings */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle>Bank Transfer</CardTitle>
                    <CardDescription>Accept bank transfers and EFTs</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={settings.bank_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, bank_enabled: checked }))}
                />
              </div>
            </CardHeader>
            {settings.bank_enabled && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      placeholder="e.g., Equity Bank"
                      value={settings.bank_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, bank_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input
                      id="account-name"
                      placeholder="e.g., Acme Corporation Ltd"
                      value={settings.bank_account_name}
                      onChange={(e) => setSettings(prev => ({ ...prev, bank_account_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      placeholder="e.g., 0123456789"
                      value={settings.bank_account_number}
                      onChange={(e) => setSettings(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      placeholder="e.g., Westlands Branch"
                      value={settings.bank_branch}
                      onChange={(e) => setSettings(prev => ({ ...prev, bank_branch: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swift">SWIFT Code (Optional)</Label>
                    <Input
                      id="swift"
                      placeholder="e.g., EABOROBI"
                      value={settings.bank_swift_code}
                      onChange={(e) => setSettings(prev => ({ ...prev, bank_swift_code: e.target.value }))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bank details will appear on invoices for customers paying via bank transfer.
                </p>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Automated Payment Collection */}
        <TabsContent value="automated" className="space-y-6 mt-6">
          {/* Security Notice */}
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Security Notice</p>
                  <p className="text-xs text-muted-foreground">
                    API keys are encrypted and stored securely. We only display the last 4 characters for your reference.
                    Never share your secret keys with anyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paystack */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#00C3F7]/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-[#00C3F7]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Paystack</CardTitle>
                      {paystackConfig.isEnabled && (
                        <Badge variant={paystackConfig.isLiveMode ? 'default' : 'secondary'}>
                          {paystackConfig.isLiveMode ? 'Live' : 'Test'}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>Accept cards, bank transfers, and mobile money</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={paystackConfig.isEnabled}
                  onCheckedChange={(checked) => setPaystackConfig(prev => ({ ...prev, isEnabled: checked }))}
                />
              </div>
            </CardHeader>
            {paystackConfig.isEnabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm">Live Mode</span>
                  </div>
                  <Switch
                    checked={paystackConfig.isLiveMode}
                    onCheckedChange={(checked) => setPaystackConfig(prev => ({ ...prev, isLiveMode: checked }))}
                  />
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Public Key</Label>
                    <Input
                      placeholder={paystackConfig.isLiveMode ? 'pk_live_...' : 'pk_test_...'}
                      value={paystackConfig.publicKey}
                      onChange={(e) => setPaystackConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.paystackSecret ? 'text' : 'password'}
                        placeholder={paystackConfig.secretKeyHint || (paystackConfig.isLiveMode ? 'sk_live_...' : 'sk_test_...')}
                        value={paystackConfig.secretKey}
                        onChange={(e) => setPaystackConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, paystackSecret: !prev.paystackSecret }))}
                      >
                        {showSecrets.paystackSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {paystackConfig.secretKeyHint && !paystackConfig.secretKey && (
                      <p className="text-xs text-muted-foreground">Current key: {paystackConfig.secretKeyHint}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook Secret (Optional)</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.paystackWebhook ? 'text' : 'password'}
                        placeholder={paystackConfig.webhookSecretHint || 'whsec_...'}
                        value={paystackConfig.webhookSecret}
                        onChange={(e) => setPaystackConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, paystackWebhook: !prev.paystackWebhook }))}
                      >
                        {showSecrets.paystackWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://dashboard.paystack.com" target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Paystack Dashboard
                    </a>
                  </Button>
                  <Button onClick={() => handleSaveGateway('paystack')} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Paystack
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Flutterwave */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-[#F5A623]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Flutterwave</CardTitle>
                      {flutterwaveConfig.isEnabled && (
                        <Badge variant={flutterwaveConfig.isLiveMode ? 'default' : 'secondary'}>
                          {flutterwaveConfig.isLiveMode ? 'Live' : 'Test'}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>Accept payments across Africa</CardDescription>
                  </div>
                </div>
                <Switch
                  checked={flutterwaveConfig.isEnabled}
                  onCheckedChange={(checked) => setFlutterwaveConfig(prev => ({ ...prev, isEnabled: checked }))}
                />
              </div>
            </CardHeader>
            {flutterwaveConfig.isEnabled && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm">Live Mode</span>
                  </div>
                  <Switch
                    checked={flutterwaveConfig.isLiveMode}
                    onCheckedChange={(checked) => setFlutterwaveConfig(prev => ({ ...prev, isLiveMode: checked }))}
                  />
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Public Key</Label>
                    <Input
                      placeholder={flutterwaveConfig.isLiveMode ? 'FLWPUBK-...' : 'FLWPUBK_TEST-...'}
                      value={flutterwaveConfig.publicKey}
                      onChange={(e) => setFlutterwaveConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.flutterwaveSecret ? 'text' : 'password'}
                        placeholder={flutterwaveConfig.secretKeyHint || (flutterwaveConfig.isLiveMode ? 'FLWSECK-...' : 'FLWSECK_TEST-...')}
                        value={flutterwaveConfig.secretKey}
                        onChange={(e) => setFlutterwaveConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, flutterwaveSecret: !prev.flutterwaveSecret }))}
                      >
                        {showSecrets.flutterwaveSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {flutterwaveConfig.secretKeyHint && !flutterwaveConfig.secretKey && (
                      <p className="text-xs text-muted-foreground">Current key: {flutterwaveConfig.secretKeyHint}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook Secret (Optional)</Label>
                    <div className="relative">
                      <Input
                        type={showSecrets.flutterwaveWebhook ? 'text' : 'password'}
                        placeholder={flutterwaveConfig.webhookSecretHint || 'Enter webhook secret'}
                        value={flutterwaveConfig.webhookSecret}
                        onChange={(e) => setFlutterwaveConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, flutterwaveWebhook: !prev.flutterwaveWebhook }))}
                      >
                        {showSecrets.flutterwaveWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://dashboard.flutterwave.com" target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Flutterwave Dashboard
                    </a>
                  </Button>
                  <Button onClick={() => handleSaveGateway('flutterwave')} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Flutterwave
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
