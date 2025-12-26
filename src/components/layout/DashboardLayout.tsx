import { useState } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
  Menu,
  LogOut,
  ChevronDown,
  UserCircle,
  Wallet,
  Bell,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { TrialCountdown } from '@/components/trial/TrialCountdown';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Employees', href: '/payroll/employees', icon: Users },
  { name: 'Payroll Runs', href: '/payroll/runs', icon: Wallet },
  { name: 'Customers', href: '/customers', icon: Building2 },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Expense Budgets', href: '/expenses/budgets', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Invoice Aging', href: '/reports/aging', icon: Clock },
  { name: 'Expense Reports', href: '/reports/expenses', icon: FileText },
];

const settingsNavigation = [
  { name: 'Organization', href: '/settings/organization', icon: Building2 },
  { name: 'Payment Gateways', href: '/settings/gateways', icon: CreditCard },
  { name: 'Subscription', href: '/settings/subscription', icon: Receipt },
  { name: 'Team', href: '/settings/team', icon: Users },
];

export function DashboardLayout() {
  const { user, profile, currentOrganization, organizations, setCurrentOrganization, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="space-y-1">
        <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Main
        </p>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          );
        })}
      </div>

      <div className="space-y-1 mt-6">
        <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Settings
        </p>
        {settingsNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-card lg:flex">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">PayFlow</span>
          </Link>
        </div>

        {/* Organization Switcher */}
        <div className="p-4 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-auto py-2.5 px-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {currentOrganization?.name || 'Select Organization'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {currentOrganization?.subscription_plan || 'Free'}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => setCurrentOrganization(org)}
                  className={cn(
                    'cursor-pointer',
                    currentOrganization?.id === org.id && 'bg-primary/10'
                  )}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {org.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-1">
            <NavItems />
          </nav>
        </ScrollArea>

        {/* Disclaimer & Legal */}
        <div className="p-4 border-t space-y-2">
          <p className="text-[10px] text-muted-foreground text-center leading-tight">
            PayFlow is a software tool. We never hold, process, or custody your funds.
          </p>
          <div className="flex justify-center gap-2 text-[10px]">
            <NavLink to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms
            </NavLink>
            <span className="text-muted-foreground">·</span>
            <NavLink to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-4 border-b bg-card px-4 lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex h-16 items-center gap-3 border-b px-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">PayFlow</span>
            </div>
            <ScrollArea className="flex-1 px-4 py-4">
              <nav className="space-y-1">
                <NavItems onItemClick={() => setMobileMenuOpen(false)} />
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">PayFlow</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="fixed inset-x-0 top-0 z-40 hidden h-16 items-center gap-4 border-b bg-card/95 backdrop-blur px-6 lg:ml-64 lg:flex">
        <div className="flex-1" />
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium">
                {profile?.full_name || user?.email}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/settings/profile" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/settings/organization" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-8">
          {/* Trial Countdown Banner */}
          <div className="mb-6">
            <TrialCountdown />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}