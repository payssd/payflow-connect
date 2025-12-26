import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, Loader2, Plus, Sparkles, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ALL_COUNTRIES } from '@/lib/countryConfig';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface AddOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddOrganizationDialog({ open, onOpenChange }: AddOrganizationDialogProps) {
  const { currentOrganization, createOrganization, setCurrentOrganization, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  // Check if user has a plan that allows multiple organizations
  // Growth and Pro plans can add multiple organizations
  const allowedPlans = ['growth', 'pro'];
  const canAddOrganization = currentOrganization?.subscription_plan && 
    allowedPlans.includes(currentOrganization.subscription_plan);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      phone: '',
      country: 'Kenya',
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    if (!canAddOrganization) {
      toast({
        title: 'Upgrade Required',
        description: 'Please upgrade to Growth or Pro plan to add multiple organizations.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: newOrg, error } = await createOrganization({
        name: data.name,
        email: data.email,
        phone: data.phone,
        country: data.country,
      });

      if (error) throw error;

      if (newOrg) {
        setCurrentOrganization(newOrg);
        toast({
          title: 'Organization Created',
          description: `${data.name} has been created successfully.`,
        });
        onOpenChange(false);
        form.reset();
      }
    } catch (err: any) {
      console.error('Error creating organization:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/settings/subscription');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Add New Organization
          </DialogTitle>
          <DialogDescription>
            Create an additional organization to manage separate businesses or teams.
          </DialogDescription>
        </DialogHeader>

        {!canAddOrganization ? (
          // Upgrade prompt for Starter plan users
          <div className="py-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Upgrade to Add Organizations</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Multiple organizations are available on Growth and Pro plans. 
                    Upgrade now to manage separate businesses, clients, or teams.
                  </p>
                </div>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Unlimited organizations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Separate billing per organization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Team collaboration features</span>
                  </div>
                </div>
                <Button onClick={handleUpgrade} className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Growth
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Organization creation form for eligible users
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="My New Company Ltd" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+254 700 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Organization
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
