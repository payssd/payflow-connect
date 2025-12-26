import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, Save, Eye, EyeOff, AlertCircle, ExternalLink, ArrowLeft, 
  AlertTriangle, Smartphone, CreditCard, Landmark, Layers, Globe 
} from 'lucide-react';
import { getGatewayById, type PaymentGateway, type GatewayField } from '@/lib/gatewayRegistry';

interface GatewayConfigFormProps {
  gatewayId: string;
  config: Record<string, unknown>;
  isLiveMode: boolean;
  isSaving: boolean;
  isValidating?: boolean;
  errors: Record<string, string>;
  onConfigChange: (field: string, value: unknown) => void;
  onLiveModeChange: (isLive: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  mobile_money: <Smartphone className="h-5 w-5" />,
  card_gateway: <CreditCard className="h-5 w-5" />,
  bank_transfer: <Landmark className="h-5 w-5" />,
  aggregator: <Layers className="h-5 w-5" />,
  international: <Globe className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  mobile_money: 'bg-success/10 text-success',
  card_gateway: 'bg-primary/10 text-primary',
  bank_transfer: 'bg-info/10 text-info',
  aggregator: 'bg-primary/10 text-primary',
  international: 'bg-purple-500/10 text-purple-500',
};

export function GatewayConfigForm({
  gatewayId,
  config,
  isLiveMode,
  isSaving,
  isValidating = false,
  errors,
  onConfigChange,
  onLiveModeChange,
  onSave,
  onBack,
}: GatewayConfigFormProps) {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const gateway = getGatewayById(gatewayId);

  if (!gateway) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Gateway not found</p>
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to gateway list
          </Button>
        </CardContent>
      </Card>
    );
  }

  const toggleSecret = (fieldName: string) => {
    setShowSecrets(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const renderField = (field: GatewayField) => {
    const value = config[field.name] as string || '';
    const error = errors[field.name];
    const isSecret = field.type === 'password';
    const isVisible = showSecrets[field.name];

    if (field.type === 'select') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Select 
            value={value} 
            onValueChange={(val) => onConfigChange(field.name, val)}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="relative">
          <Input
            id={field.name}
            type={isSecret && !isVisible ? 'password' : 'text'}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => onConfigChange(field.name, e.target.value)}
            className={error ? 'border-destructive pr-10' : isSecret ? 'pr-10' : ''}
          />
          {isSecret && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => toggleSecret(field.name)}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[gateway.category]}`}>
              {categoryIcons[gateway.category]}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {gateway.name}
                <Badge variant={isLiveMode ? 'default' : 'secondary'}>
                  {isLiveMode ? 'Live' : 'Test'}
                </Badge>
              </CardTitle>
              <CardDescription>{gateway.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm">Live Mode</span>
          </div>
          <Switch
            checked={isLiveMode}
            onCheckedChange={onLiveModeChange}
          />
        </div>

        {/* Documentation Link */}
        {gateway.documentationUrl && (
          <div className="p-3 rounded-lg bg-info/10 border border-info/20">
            <a 
              href={gateway.documentationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-info flex items-center gap-2 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View {gateway.name} API Documentation
            </a>
          </div>
        )}

        {/* Supported Methods */}
        <div>
          <Label className="text-xs text-muted-foreground">Supported Payment Methods</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {gateway.supportedMethods.map((method) => (
              <Badge key={method} variant="outline" className="text-xs">
                {method}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-4 pt-2">
          {gateway.fields.map(renderField)}
        </div>

        {/* Save Button */}
        <Button 
          onClick={onSave} 
          disabled={isSaving || isValidating} 
          className="w-full"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Validating API Keys...
            </>
          ) : isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Validate & Save {gateway.name} Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
