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
import { Loader2, Smartphone, Building2, Save, CreditCard, Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface ManualPaymentSettings {
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

interface GatewayState {
  isEnabled: boolean;
  isLiveMode: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  secretKeyHint: string;
  webhookSecretHint: string;
}

export default function PaymentSettings() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual payment settings (stored in payment_gateway_configs with gateway='manual')
  const [settings, setSettings] = useState<ManualPaymentSettings>({
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
  const [paystackConfig, setPaystackConfig] = useState<GatewayState>({
    isEnabled: false,
    isLiveMode: false,
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    secretKeyHint: '',
    webhookSecretHint: '',
  });

  const [flutterwaveConfig, setFlutterwaveConfig] = useState<GatewayState>({
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
    
    // Fetch all gateway configs including manual settings
    const { data: gatewayData } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('organization_id', currentOrganization.id);

    if (gatewayData) {
      // Manual payment settings stored as 'manual' gateway
      const manual = gatewayData.find(g => g.gateway === 'manual');
      if (manual && manual.config) {
        const config = manual.config as Record<string, unknown>;
        setSettings({
          mpesa_enabled: Boolean(config.mpesa_enabled),
          mpesa_business_shortcode: String(config.mpesa_business_shortcode || ''),
          mpesa_account_name: String(config.mpesa_account_name || ''),
          bank_enabled: Boolean(config.bank_enabled),
          bank_name: String(config.bank_name || ''),
          bank_account_name: String(config.bank_account_name || ''),
          bank_account_number: String(config.bank_account_number || ''),
          bank_branch: String(config.bank_branch || ''),
          bank_swift_code: String(config.bank_swift_code || ''),
        });
      }

      const paystack = gatewayData.find(g => g.gateway === 'paystack');
      if (paystack && paystack.config) {
        const config = paystack.config as Record<string, unknown>;
        setPaystackConfig({
          isEnabled: paystack.is_active,
          isLiveMode: Boolean(config.is_live_mode),
          publicKey: String(config.public_key || ''),
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: String(config.secret_key_hint || ''),
          webhookSecretHint: String(config.webhook_secret_hint || ''),
        });
      }

      const flutterwave = gatewayData.find(g => g.gateway === 'flutterwave');
      if (flutterwave && flutterwave.config) {
        const config = flutterwave.config as Record<string, unknown>;
        setFlutterwaveConfig({
          isEnabled: flutterwave.is_active,
          isLiveMode: Boolean(config.is_live_mode),
          publicKey: String(config.public_key || ''),
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: String(config.secret_key_hint || ''),
          webhookSecretHint: String(config.webhook_secret_hint || ''),
        });
      }
    }

    setIsLoading(false);
  };

  const handleSaveManual = async () => {
    if (!currentOrganization) return;

    setIsSaving(true);
    
    const configPayload = {
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

    // Check if manual config exists
    const { data: existing } = await supabase
      .from('payment_gateway_configs')
      .select('id')
      .eq('organization_id', currentOrganization.id)
      .eq('gateway', 'manual')
      .maybeSingle();

    let error;
    if (existing) {
      const result = await supabase
        .from('payment_gateway_configs')
        .update({ 
          config: configPayload,
          is_active: settings.mpesa_enabled || settings.bank_enabled,
        })
        .eq('id', existing.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('payment_gateway_configs')
        .insert({
          organization_id: currentOrganization.id,
          gateway: 'manual',
          config: configPayload,
          is_active: settings.mpesa_enabled || settings.bank_enabled,
        });
      error = result.error;
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
          secretKeyHint: data?.config?.secretKeyHint || prev.secretKeyHint,
          webhookSecretHint: data?.config?.webhookSecretHint || prev.webhookSecretHint,
        }));
      } else {
        setFlutterwaveConfig(prev => ({
          ...prev,
          secretKey: '',
          webhookSecret: '',
          secretKeyHint: data?.config?.secretKeyHint || prev.secretKeyHint,
          webhookSecretHint: data?.config?.webhookSecretHint || prev.webhookSecretHint,
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paystack-public">Public Key</Label>
                    <Input
                      id="paystack-public"
                      placeholder="pk_live_..."
                      value={paystackConfig.publicKey}
                      onChange={(e) => setPaystackConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paystack-secret">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="paystack-secret"
                        type={showSecrets.paystackSecret ? 'text' : 'password'}
                        placeholder={paystackConfig.secretKeyHint || 'sk_live_...'}
                        value={paystackConfig.secretKey}
                        onChange={(e) => setPaystackConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, paystackSecret: !prev.paystackSecret }))}
                      >
                        {showSecrets.paystackSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveGateway('paystack')} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Paystack Settings
                </Button>
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
                    <CardDescription>Accept cards, M-Pesa, and bank transfers across Africa</CardDescription>
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="flw-public">Public Key</Label>
                    <Input
                      id="flw-public"
                      placeholder="FLWPUBK-..."
                      value={flutterwaveConfig.publicKey}
                      onChange={(e) => setFlutterwaveConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flw-secret">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="flw-secret"
                        type={showSecrets.flutterwaveSecret ? 'text' : 'password'}
                        placeholder={flutterwaveConfig.secretKeyHint || 'FLWSECK-...'}
                        value={flutterwaveConfig.secretKey}
                        onChange={(e) => setFlutterwaveConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowSecrets(prev => ({ ...prev, flutterwaveSecret: !prev.flutterwaveSecret }))}
                      >
                        {showSecrets.flutterwaveSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveGateway('flutterwave')} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Flutterwave Settings
                </Button>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
