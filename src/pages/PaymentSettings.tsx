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
import { 
  Loader2, Smartphone, Building2, Save, Shield, AlertCircle, 
  Layers, Plus, Settings2, CheckCircle 
} from 'lucide-react';
import { GatewaySelector } from '@/components/payments/GatewaySelector';
import { GatewayConfigForm } from '@/components/payments/GatewayConfigForm';
import { getGatewayById, getActiveGateways, type PaymentGateway } from '@/lib/gatewayRegistry';

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

interface GatewayConfig {
  id: string;
  gateway: string;
  is_active: boolean;
  config: Record<string, unknown> | null;
}

export default function PaymentSettings() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // View state for automated tab
  const [automatedView, setAutomatedView] = useState<'list' | 'config'>('list');
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  
  // Manual payment settings
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

  // All gateway configs from database
  const [gatewayConfigs, setGatewayConfigs] = useState<GatewayConfig[]>([]);
  
  // Current gateway config being edited
  const [currentConfig, setCurrentConfig] = useState<Record<string, unknown>>({});
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentOrganization) {
      fetchSettings();
    }
  }, [currentOrganization]);

  const fetchSettings = async () => {
    if (!currentOrganization) return;
    
    setIsLoading(true);
    
    const { data: gatewayData } = await supabase
      .from('payment_gateway_configs')
      .select('*')
      .eq('organization_id', currentOrganization.id);

    if (gatewayData) {
      // Cast the config properly
      const configs: GatewayConfig[] = gatewayData.map(g => ({
        id: g.id,
        gateway: g.gateway,
        is_active: g.is_active,
        config: g.config as Record<string, unknown> | null,
      }));
      setGatewayConfigs(configs);
      
      // Load manual settings
      const manual = configs.find(g => g.gateway === 'manual');
      if (manual && manual.config) {
        const config = manual.config;
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
    }

    setIsLoading(false);
  };

  const getEnabledGateways = (): string[] => {
    return gatewayConfigs
      .filter(g => g.is_active && g.gateway !== 'manual')
      .map(g => g.gateway);
  };

  const handleSelectGateway = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    setValidationErrors({});
    
    // Load existing config if available
    const existingConfig = gatewayConfigs.find(g => g.gateway === gatewayId);
    if (existingConfig && existingConfig.config) {
      const config = existingConfig.config as Record<string, unknown>;
      setCurrentConfig(config);
      setIsLiveMode(config.is_live_mode === true || config.is_live_mode === 'true');
    } else {
      setCurrentConfig({});
      setIsLiveMode(false);
    }
    
    setAutomatedView('config');
  };

  const handleConfigChange = (field: string, value: unknown) => {
    setCurrentConfig(prev => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved', description: 'Your payment settings have been updated.' });
    }
  };

  const handleSaveGateway = async () => {
    if (!currentOrganization || !selectedGateway) return;

    const gateway = getGatewayById(selectedGateway);
    if (!gateway) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    gateway.fields.forEach(field => {
      if (field.required && !currentConfig[field.name]) {
        errors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke('save-gateway-config', {
        body: {
          organizationId: currentOrganization.id,
          provider: selectedGateway,
          ...currentConfig,
          isEnabled: true,
          isLiveMode,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Gateway configured', description: `${gateway.name} settings saved successfully.` });
      
      // Refresh configs
      await fetchSettings();
      setAutomatedView('list');
      setSelectedGateway(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save gateway configuration';
      toast({ title: 'Error saving gateway', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToList = () => {
    setAutomatedView('list');
    setSelectedGateway(null);
    setCurrentConfig({});
    setValidationErrors({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const enabledGateways = getEnabledGateways();

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
        <p className="text-muted-foreground">
          Configure how you collect payments from customers.
        </p>
      </div>

      {/* Enabled Gateways Summary */}
      {enabledGateways.length > 0 && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Active Payment Gateways</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {enabledGateways.map(gw => {
                    const gateway = getGatewayById(gw);
                    return gateway ? (
                      <Badge key={gw} variant="outline" className="border-success/50">
                        {gateway.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="manual">
            <Building2 className="h-4 w-4 mr-2" />
            Manual Payments
          </TabsTrigger>
          <TabsTrigger value="automated">
            <Layers className="h-4 w-4 mr-2" />
            Automated Collection
          </TabsTrigger>
        </TabsList>

        {/* Manual Payment Methods */}
        <TabsContent value="manual" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button onClick={handleSaveManual} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          {/* M-Pesa Manual Settings */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle>M-Pesa (Manual)</CardTitle>
                    <CardDescription>Display M-Pesa details for manual payments</CardDescription>
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
                    API keys are encrypted and stored securely. Only connect to payment gateways you trust.
                    Never share your secret keys with anyone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {automatedView === 'list' ? (
            <GatewaySelector 
              enabledGateways={enabledGateways}
              onSelectGateway={handleSelectGateway}
            />
          ) : selectedGateway ? (
            <GatewayConfigForm
              gatewayId={selectedGateway}
              config={currentConfig}
              isLiveMode={isLiveMode}
              isSaving={isSaving}
              errors={validationErrors}
              onConfigChange={handleConfigChange}
              onLiveModeChange={setIsLiveMode}
              onSave={handleSaveGateway}
              onBack={handleBackToList}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
