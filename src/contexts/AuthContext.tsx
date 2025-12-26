import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  logo_url: string | null;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
  subscription_plan: 'starter' | 'growth' | 'pro' | null;
  subscription_ends_at: string | null;
  subscription_started_at: string | null;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  currentMembership: OrganizationMember | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setCurrentOrganization: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createOrganization: (data: { name: string; email: string; phone?: string; country: string }) => Promise<{ data: Organization | null; error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentMembership, setCurrentMembership] = useState<OrganizationMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  }, []);

  const fetchOrganizations = useCallback(async (userId: string) => {
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching memberships:', memberError);
      return { orgs: [], membership: null };
    }

    if (!memberships || memberships.length === 0) {
      return { orgs: [], membership: null };
    }

    const orgIds = memberships.map((m) => m.organization_id);
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIds);

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return { orgs: [], membership: null };
    }

    return { 
      orgs: orgs as Organization[], 
      memberships: memberships as OrganizationMember[] 
    };
  }, []);

  const refreshOrganizations = useCallback(async () => {
    if (!user) return;
    const { orgs, memberships } = await fetchOrganizations(user.id);
    setOrganizations(orgs);
    
    // If we have orgs but no current org, set the first one
    if (orgs.length > 0 && !currentOrganization) {
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;
      const orgToSet = savedOrg || orgs[0];
      setCurrentOrganization(orgToSet);
      
      const membership = memberships?.find(m => m.organization_id === orgToSet.id) || null;
      setCurrentMembership(membership);
    }
  }, [user, currentOrganization, fetchOrganizations]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // If the refresh token is invalid/missing, Supabase will fail to refresh and we must reset local auth.
        if ((event as unknown as string) === 'TOKEN_REFRESH_FAILED') {
          console.warn('Auth token refresh failed; signing out to recover.');
          localStorage.setItem('authSessionError', 'Your session expired. Please sign in again.');
          // Best-effort sign out (also clears local storage)
          supabase.auth.signOut();

          setSession(null);
          setUser(null);
          setProfile(null);
          setOrganizations([]);
          setCurrentOrganization(null);
          setCurrentMembership(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
            fetchOrganizations(session.user.id).then(({ orgs, memberships }) => {
              setOrganizations(orgs);
              if (orgs.length > 0) {
                const savedOrgId = localStorage.getItem('currentOrganizationId');
                const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;
                const orgToSet = savedOrg || orgs[0];
                setCurrentOrganization(orgToSet);
                const membership = memberships?.find(m => m.organization_id === orgToSet.id) || null;
                setCurrentMembership(membership);
              }
              setIsLoading(false);
            });
          }, 0);
        } else {
          setProfile(null);
          setOrganizations([]);
          setCurrentOrganization(null);
          setCurrentMembership(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchOrganizations(session.user.id)
        ]).then(([profileData, { orgs, memberships }]) => {
          setProfile(profileData);
          setOrganizations(orgs);
          if (orgs.length > 0) {
            const savedOrgId = localStorage.getItem('currentOrganizationId');
            const savedOrg = savedOrgId ? orgs.find(o => o.id === savedOrgId) : null;
            const orgToSet = savedOrg || orgs[0];
            setCurrentOrganization(orgToSet);
            const membership = memberships?.find(m => m.organization_id === orgToSet.id) || null;
            setCurrentMembership(membership);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchOrganizations]);

  // Save current org to localStorage when it changes
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
    }
  }, [currentOrganization]);

  const handleSetCurrentOrganization = useCallback((org: Organization) => {
    setCurrentOrganization(org);
    // Update the membership too
    if (user) {
      supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', org.id)
        .maybeSingle()
        .then(({ data }) => {
          setCurrentMembership(data as OrganizationMember | null);
        });
    }
  }, [user]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentOrganizationId');
  };

  const createOrganization = async (data: { name: string; email: string; phone?: string; country: string }) => {
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // NOTE: We intentionally avoid selecting the organization immediately after insert.
    // The organizations SELECT policy requires the user to be an org member, which only
    // happens after we insert into organization_members.
    const orgId = crypto.randomUUID();

    // Create organization (no RETURNING/SELECT)
    const { error: orgError } = await supabase.from('organizations').insert({
      id: orgId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      country: data.country,
    });

    if (orgError) {
      return { data: null, error: orgError as Error };
    }

    // Add user as owner
    const { error: memberError } = await supabase.from('organization_members').insert({
      organization_id: orgId,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      return { data: null, error: memberError as Error };
    }

    // Fetch the org now that membership exists (SELECT policy will allow it)
    const { data: org, error: fetchOrgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle();

    if (fetchOrgError) {
      return { data: null, error: fetchOrgError as Error };
    }

    // Refresh organizations
    await refreshOrganizations();

    return { data: (org as Organization | null) ?? null, error: null };
  };

  const value = {
    user,
    session,
    profile,
    organizations,
    currentOrganization,
    currentMembership,
    isLoading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    setCurrentOrganization: handleSetCurrentOrganization,
    refreshOrganizations,
    refreshProfile,
    createOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
