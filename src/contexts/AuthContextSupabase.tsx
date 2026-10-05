import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthContext, type AuthContextValue } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  getPaymentStatus,
  hasPremiumPreferences,
  isAdminPreferences,
  isTeacherPreferences,
} from "@/lib/authRoles";
import { INACTIVE_ACCOUNT_NOTICE_KEY } from "@/lib/authStorage";
import { updateStudentName } from "@/lib/performanceUtils";
import type {
  AuthUser,
  RegisterInput,
  UpdateProfileInput,
  UserProfile,
} from "@/lib/auth/types";

const deriveDisplayName = (user: AuthUser | null, profile: UserProfile | null) => {
  if (profile?.name) return profile.name;
  if (user?.user_metadata?.name) return user.user_metadata.name;
  if (user?.phone) return user.phone;
  return "Student";
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  }, []);

  const applyUserData = useCallback(
    async (authUser: any, userProfile: UserProfile) => {
      const formattedUser: AuthUser = {
        id: authUser.id,
        phone: authUser.phone || authUser.user_metadata?.phone || authUser.user_metadata?.mobile || '',
        email: authUser.email,
        user_metadata: {
          name: authUser.user_metadata?.name || userProfile?.name || null,
          mobile: authUser.user_metadata?.mobile || authUser.phone || userProfile?.mobile || '',
        },
      };

      setUser(formattedUser);
      setProfile(userProfile);

      if (formattedUser.user_metadata?.name) {
        updateStudentName(formattedUser.user_metadata.name);
      }

      return userProfile;
    },
    []
  );

  const checkInactiveAccount = useCallback(
    (userProfile: UserProfile | null) => {
      if (!userProfile?.is_active) {
        const notice = "Your account is currently inactive. Contact the administrator.";
        sessionStorage.setItem(INACTIVE_ACCOUNT_NOTICE_KEY, notice);
      }
    },
    []
  );

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (session?.user) {
          // Fetch profile from users table
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (profileData) {
            const userProfile: UserProfile = {
              id: profileData.id,
              auth_id: profileData.auth_id,
              name: profileData.name,
              mobile: profileData.mobile,
              email: profileData.email,
              phone: profileData.mobile, // Use mobile as phone
              grade: profileData.grade,
              school: profileData.school,
              profile_image_url: profileData.profile_image_url,
              date_of_birth: profileData.date_of_birth,
              gender: profileData.gender,
              preferences: profileData.preferences || {},
              is_active: profileData.is_active,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
              last_login: profileData.last_login,
            };

            await applyUserData(session.user, userProfile);
            checkInactiveAccount(userProfile);
          } else {
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      } catch (error) {
        console.error("Auth bootstrap error:", error);
        if (active) {
          clearAuthState();
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (active) {
        console.warn("Auth bootstrap timeout - clearing loading state");
        setIsLoading(false);
      }
    }, 5000);

    bootstrap();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);

        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (profileData) {
            const userProfile: UserProfile = {
              id: profileData.id,
              auth_id: profileData.auth_id,
              name: profileData.name,
              mobile: profileData.mobile,
              email: profileData.email,
              phone: profileData.mobile, // Use mobile as phone
              grade: profileData.grade,
              school: profileData.school,
              profile_image_url: profileData.profile_image_url,
              date_of_birth: profileData.date_of_birth,
              gender: profileData.gender,
              preferences: profileData.preferences || {},
              is_active: profileData.is_active,
              created_at: profileData.created_at,
              updated_at: profileData.updated_at,
              last_login: profileData.last_login,
            };

            await applyUserData(session.user, userProfile);
            checkInactiveAccount(userProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          clearAuthState();
        }
      }
    );

    return () => {
      active = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [clearAuthState, applyUserData, checkInactiveAccount]);

  const value = useMemo<AuthContextValue>(() => ({
    session: user ? { user, accessToken: 'supabase-token', expiresAt: null } : null,
    user,
    profile,
    isAuthenticated: Boolean(user),
    isAdmin: isAdminPreferences(profile?.preferences as any),
    isTeacher: isTeacherPreferences(profile?.preferences as any),
    hasPremiumAccess: hasPremiumPreferences(profile?.preferences as any),
    paymentStatus: getPaymentStatus(profile?.preferences as any),
    isLoading,
    displayName: deriveDisplayName(user, profile),
    refreshProfile: async () => {
      try {
        if (!user) return null;

        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (profileData) {
          const userProfile: UserProfile = {
            id: profileData.id,
            auth_id: profileData.auth_id,
            name: profileData.name,
            mobile: profileData.mobile,
            email: profileData.email,
            phone: profileData.mobile, // Use mobile as phone
            grade: profileData.grade,
            school: profileData.school,
            profile_image_url: profileData.profile_image_url,
            date_of_birth: profileData.date_of_birth,
            gender: profileData.gender,
            preferences: profileData.preferences || {},
            is_active: profileData.is_active,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
            last_login: profileData.last_login,
          };

          return await applyUserData(user, userProfile);
        }
        return null;
      } catch (error) {
        console.error("Refresh profile error:", error);
        return null;
      }
    },
    signIn: async (phone: string, password: string) => {
      try {
        console.log("Supabase signIn with phone:", phone);
        
        // Sign in with Supabase (using email as phone for now)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${phone}@university-door.local`, // Convert phone to email format
          password,
        });

        if (error) {
          console.error("Supabase auth error:", error);
          throw new Error(error.message);
        }

        if (data.user) {
          // Profile will be loaded by auth state change listener
          return profile;
        }
        
        return null;
      } catch (error) {
        console.error("Sign in error:", error);
        throw error;
      }
    },
    register: async (input: RegisterInput) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: `${input.phone}@university-door.local`,
          password: input.password,
          options: {
            data: {
              name: input.fullName,
              mobile: input.phone,
            },
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        // Profile will be created automatically by the trigger
        return profile;
      } catch (error) {
        console.error("Register error:", error);
        throw error;
      }
    },
    updateProfile: async (input: UpdateProfileInput) => {
      try {
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
          .from('users')
          .update({
            name: input.name,
            email: input.email,
            updated_at: new Date().toISOString(),
          })
          .eq('auth_id', user.id);

        if (error) {
          throw new Error(error.message);
        }

        // Refresh profile
        return await value.refreshProfile();
      } catch (error) {
        console.error("Update profile error:", error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        await supabase.auth.signOut();
        clearAuthState();
      } catch (error) {
        console.error("Sign out error:", error);
        clearAuthState();
      }
    },
  }), [user, profile, isLoading, clearAuthState, applyUserData, checkInactiveAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
