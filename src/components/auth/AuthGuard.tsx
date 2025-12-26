import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireOrganization?: boolean;
}

export function AuthGuard({ children, requireOrganization = true }: AuthGuardProps) {
  const { user, isLoading, organizations, currentOrganization } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user needs an organization but doesn't have one, redirect to onboarding
  if (requireOrganization && organizations.length === 0) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // If user has orgs but none selected, this shouldn't happen but handle it
  if (requireOrganization && !currentOrganization && organizations.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
