import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Mail, LogIn } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*, organizations(name)')
        .eq('token', token)
        .maybeSingle();

      if (error || !data) {
        setError('This invitation is invalid or has already been used.');
        setLoading(false);
        return;
      }

      if (data.status !== 'pending') {
        setError(`This invitation has already been ${data.status}.`);
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired.');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation details.');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setAccepting(false);
        return;
      }

      setSuccess(true);
      toast.success(data.message || 'Successfully joined the organization!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast.error(err.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold">Invalid Invitation</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button asChild className="mt-4">
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold">Welcome to the Team!</h2>
              <p className="text-muted-foreground">
                You have successfully joined {invitation?.organizations?.name || 'the organization'}.
              </p>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              You've been invited to join <strong>{invitation?.organizations?.name}</strong> as a <strong>{invitation?.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              To accept this invitation, please log in or create an account with <strong>{invitation?.email}</strong>.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link to={`/auth?redirect=/accept-invitation?token=${token}`}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In to Accept
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/auth?mode=signup&email=${encodeURIComponent(invitation?.email || '')}&redirect=/accept-invitation?token=${token}`}>
                  Create Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in - show accept button
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation?.organizations?.name}</strong> as a <strong>{invitation?.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.email?.toLowerCase() !== invitation?.email?.toLowerCase() && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-sm">
              <p>
                This invitation was sent to <strong>{invitation?.email}</strong>. 
                You are currently logged in as <strong>{user.email}</strong>.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={handleAccept} disabled={accepting}>
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Decline</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
