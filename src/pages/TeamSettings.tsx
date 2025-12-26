import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Crown, Shield, User, Loader2, Mail, UserPlus, Send, X, RefreshCw, Trash2, Clock } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
  created_at: string;
  expires_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export default function TeamSettings() {
  const { currentOrganization, profile, currentMembership } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  const canManageTeam = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  useEffect(() => {
    if (currentOrganization) {
      fetchTeamData();
    }
  }, [currentOrganization]);

  const fetchTeamData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('id, user_id, role')
        .eq('organization_id', currentOrganization.id);

      if (membersError) throw membersError;

      // Fetch profiles for members
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const membersWithProfiles = members.map(member => ({
          ...member,
          profile: profiles?.find(p => p.user_id === member.user_id) || null,
        })) as TeamMember[];

        setTeamMembers(membersWithProfiles);
      }

      // Fetch pending invitations
      const { data: invites, error: invitesError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      setInvitations(invites as Invitation[] || []);
    } catch (error: any) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!currentOrganization || !email.trim()) return;

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: email.trim().toLowerCase(),
          role,
          organizationId: currentOrganization.id,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setInviting(false);
        return;
      }

      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('member');
      setInviteOpen(false);
      fetchTeamData();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Invitation cancelled');
      fetchTeamData();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    if (!currentOrganization) return;

    try {
      // Delete old invitation
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitation.id);

      // Send new invitation
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: invitation.email,
          role: invitation.role,
          organizationId: currentOrganization.id,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Invitation resent to ${invitation.email}`);
      fetchTeamData();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Team member removed');
      fetchTeamData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-amber-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-primary" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      owner: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      admin: 'bg-primary/10 text-primary',
      member: 'bg-muted text-muted-foreground',
    };
    return (
      <Badge className={`border-0 ${styles[role] || styles.member}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (!currentOrganization || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
        <p className="text-muted-foreground">Manage your team and their access levels.</p>
      </div>

      <Card className="border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team
            </CardTitle>
            <CardDescription>People with access to {currentOrganization.name}</CardDescription>
          </div>
          {canManageTeam && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to add a new member to {currentOrganization.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value: 'admin' | 'member') => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Member</div>
                              <div className="text-xs text-muted-foreground">Can view and use most features</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Admin</div>
                              <div className="text-xs text-muted-foreground">Can manage settings and team</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting || !email.trim()}>
                    {inviting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profile?.full_name || member.profile?.email || 'Unknown'}
                        {member.user_id === profile.user_id && ' (You)'}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleIcon(member.role)}
                    {getRoleBadge(member.role)}
                    {canManageTeam && member.role !== 'owner' && member.user_id !== profile.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.profile?.full_name || member.profile?.email} from {currentOrganization.name}. They will lose access to all organization data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card className="border shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Pending Invitations
            </CardTitle>
            <CardDescription>Invitations that haven't been accepted yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 rounded-lg border bg-background">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleBadge(invitation.role)}
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600/30 bg-yellow-50 dark:bg-yellow-900/20">
                      Pending
                    </Badge>
                    {canManageTeam && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleResendInvitation(invitation)}
                          title="Resend invitation"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          title="Cancel invitation"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Permissions Info */}
      <Card className="border shadow-card bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
          <CardDescription>Understanding what each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">Owner</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Full control including billing, deleting data, and transferring ownership.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold">Admin</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Can manage team members, settings, and all business data.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Member</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Can view and work with invoices, payroll, and expenses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
