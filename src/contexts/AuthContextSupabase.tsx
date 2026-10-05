import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthContext, type AuthContextValue } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";
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
        const token = localStorage.getItem('auth_token');
        if (!active) return;
        if (token) {
          let query = supabase.from('users').select('*');
          if (/^\d+$/.test(token)) {
            query = query.eq('id', Number(token));
          } else {
            query = query.eq('phone', token);
          }
          const { data: row } = await query.maybeSingle();
          if (row) {
            const fakeAuthUser = { id: String(row.id), phone: row.phone, email: row.email, user_metadata: { name: row.name, mobile: row.phone } };
            const userProfile: UserProfile = {
              id: String(row.id), auth_id: String(row.id), name: row.name, mobile: row.phone, email: row.email,
              phone: row.phone, grade: row.grade, school: row.school, profile_image_url: row.profile_image_url,
              date_of_birth: row.date_of_birth, gender: row.gender, preferences: row.preferences || { role: 'student' },
              is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at, last_login: row.last_login,
            };
            await applyUserData(fakeAuthUser, userProfile);
            checkInactiveAccount(userProfile);
          } else { clearAuthState(); }
        } else { clearAuthState(); }
      } catch (error) {
        console.error("Auth bootstrap error:", error);
        if (active) clearAuthState();
      } finally { if (active) setIsLoading(false); }
    };

    const timeoutId = setTimeout(() => { if (active) { console.warn("Auth bootstrap timeout"); setIsLoading(false); } }, 5000);
    bootstrap();

    return () => { active = false; clearTimeout(timeoutId); };
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
          .eq('id', user.id)
          .maybeSingle();

        if (profileData) {
          const userProfile: UserProfile = {
            id: String(profileData.id),
            auth_id: String(profileData.id),
            name: profileData.name,
            mobile: profileData.phone,
            email: profileData.email,
            phone: profileData.phone,
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
    signIn: async (phoneOrEmail: string, password: string) => {
      try {
        // Allow both email (admin) and phone (students/teachers)
        const lookup = phoneOrEmail.includes('@')
          ? supabase.from('users').select('*').eq('email', phoneOrEmail.trim()).maybeSingle()
          : supabase.from('users').select('*').eq('phone', phoneOrEmail.trim()).maybeSingle();

        const { data: row, error } = await lookup;
        if (error) throw new Error(error.message);
        if (!row) throw new Error('User not found');

        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) throw new Error('Incorrect password');

        const fakeAuthUser = {
          id: String(row.id),
          phone: row.phone,
          email: row.email,
          user_metadata: { name: row.name, mobile: row.phone },
        };
        const userProfile: UserProfile = {
          id: String(row.id),
          auth_id: String(row.id),
          name: row.name,
          mobile: row.phone,
          email: row.email,
          phone: row.phone,
          grade: row.grade,
          school: row.school,
          profile_image_url: row.profile_image_url,
          date_of_birth: row.date_of_birth,
          gender: row.gender,
          preferences: row.preferences || { role: 'student' },
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: row.last_login,
        };
        await applyUserData(fakeAuthUser, userProfile);
        localStorage.setItem('auth_token', String(row.id));
        return userProfile;
      } catch (error) {
        console.error("Sign in error:", error);
        throw error;
      }
    },
    register: async (input: RegisterInput) => {
      try {
        const hashed = await bcrypt.hash(input.password, 10);
        const role = input.role || 'student';
        const { error } = await supabase.from('users').insert({
          phone: input.phone,
          password_hash: hashed,
          name: input.fullName,
          email: null,
          preferences: { role },
          is_active: true,
        });
        if (error) throw new Error(error.message);
        localStorage.setItem('auth_token', input.phone);
        // Immediately sign the new user in
        const { data: row } = await supabase
          .from('users')
          .select('*')
          .eq('phone', input.phone)
          .maybeSingle();
        if (row) {
          const fakeAuthUser = { id: String(row.id), phone: row.phone, email: row.email, user_metadata: { name: row.name, mobile: row.phone } };
          const userProfile: UserProfile = {
            id: String(row.id), auth_id: String(row.id), name: row.name, mobile: row.phone, email: row.email,
            phone: row.phone, grade: row.grade, school: row.school, profile_image_url: row.profile_image_url,
            date_of_birth: row.date_of_birth, gender: row.gender, preferences: row.preferences || { role: 'student' },
            is_active: row.is_active, created_at: row.created_at, updated_at: row.updated_at, last_login: row.last_login,
          };
          await applyUserData(fakeAuthUser, userProfile);
          return userProfile;
        }
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
            email: input.email ?? user?.email ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

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
        localStorage.removeItem('auth_token');
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
