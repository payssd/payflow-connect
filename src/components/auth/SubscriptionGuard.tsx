import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { currentOrganization } = useAuth();
  const location = useLocation();

  // Allow access to subscription-related pages
  const allowedPaths = ['/subscription', '/settings/subscription'];
  if (allowedPaths.some(path => location.pathname.startsWith(path))) {
    return <>{children}</>;
  }

  // Check if organization has active subscription
  if (currentOrganization && currentOrganization.subscription_status !== 'active' && currentOrganization.subscription_status !== 'trialing') {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
