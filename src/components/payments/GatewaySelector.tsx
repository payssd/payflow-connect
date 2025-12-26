import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, CreditCard, Landmark, Layers, Globe, Search, ExternalLink, 
  Check, Clock, Sparkles 
} from 'lucide-react';
import { 
  paymentGateways, 
  gatewayCategories, 
  getGatewaysByCategory, 
  getPopularGateways,
  searchGateways,
  type PaymentGateway 
} from '@/lib/gatewayRegistry';

interface GatewaySelectorProps {
  enabledGateways: string[];
  onSelectGateway: (gatewayId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  mobile_money: <Smartphone className="h-4 w-4" />,
  card_gateway: <CreditCard className="h-4 w-4" />,
  bank_transfer: <Landmark className="h-4 w-4" />,
  aggregator: <Layers className="h-4 w-4" />,
  international: <Globe className="h-4 w-4" />,
};

export function GatewaySelector({ enabledGateways, onSelectGateway }: GatewaySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('popular');

  const popularGateways = getPopularGateways();
  
  const filteredGateways = searchQuery 
    ? searchGateways(searchQuery)
    : activeCategory === 'popular' 
      ? popularGateways
      : getGatewaysByCategory(activeCategory);

  const renderGatewayCard = (gateway: PaymentGateway) => {
    const isEnabled = enabledGateways.includes(gateway.id);
    
    return (
      <Card 
        key={gateway.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isEnabled ? 'border-primary bg-primary/5' : 'border-border'
        } ${gateway.isComingSoon ? 'opacity-60' : ''}`}
        onClick={() => !gateway.isComingSoon && onSelectGateway(gateway.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                gateway.category === 'mobile_money' ? 'bg-success/10 text-success' :
                gateway.category === 'aggregator' ? 'bg-primary/10 text-primary' :
                gateway.category === 'bank_transfer' ? 'bg-info/10 text-info' :
                gateway.category === 'international' ? 'bg-purple-500/10 text-purple-500' :
                'bg-muted text-muted-foreground'
              }`}>
                {categoryIcons[gateway.category]}
              </div>
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  {gateway.name}
                  {gateway.isPopular && (
                    <Sparkles className="h-3 w-3 text-warning" />
                  )}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isEnabled && (
                <Badge variant="default" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
              {gateway.isComingSoon && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-xs line-clamp-2 mb-2">
            {gateway.description}
          </CardDescription>
          <div className="flex flex-wrap gap-1 mb-2">
            {gateway.supportedMethods.slice(0, 3).map((method) => (
              <Badge key={method} variant="outline" className="text-xs py-0">
                {method}
              </Badge>
            ))}
            {gateway.supportedMethods.length > 3 && (
              <Badge variant="outline" className="text-xs py-0">
                +{gateway.supportedMethods.length - 3}
              </Badge>
            )}
          </div>
          {gateway.website && !gateway.isComingSoon && (
            <a 
              href={gateway.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Visit website
            </a>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search payment gateways..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="popular" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Popular
            </TabsTrigger>
            {Object.entries(gatewayCategories).map(([key, cat]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {categoryIcons[key]}
                <span className="ml-1 hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Gateway Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGateways.map(renderGatewayCard)}
      </div>

      {filteredGateways.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No payment gateways found matching "{searchQuery}"</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <span>{paymentGateways.length} gateways available</span>
        <span>{paymentGateways.filter(g => !g.isComingSoon).length} ready for integration</span>
      </div>
    </div>
  );
}
