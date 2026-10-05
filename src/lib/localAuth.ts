import type {
  AuthSessionResponse,
  AuthUser,
  RegisterInput,
  SignInInput,
  UpdateProfileInput,
  UserProfile,
} from '@/lib/auth/types';

const AUTH_ENDPOINT = import.meta.env.VITE_AUTH_ENDPOINT_URL || '/api/auth';
const AUTH_ENDPOINT = AUTH_ENDPOINT.endsWith('/auth') ? AUTH_ENDPOINT : `${AUTH_ENDPOINT}/auth`;

console.log('AUTH_ENDPOINT:', AUTH_ENDPOINT);
console.log('AUTH_ENDPOINT:', AUTH_ENDPOINT);

// Helper to convert backend response to AuthUser
const buildAuthUser = (data: any): AuthUser => ({
  id: String(data.user?.id || data.profile?.id),
  phone: data.user?.phone || data.profile?.phone || '',
  email: data.user?.email || data.profile?.email || null,
  user_metadata: {
    name: data.user?.user_metadata?.name || data.profile?.name || null,
    mobile: data.user?.user_metadata?.mobile || data.profile?.phone || '',
  },
});

// Helper to convert backend response to UserProfile
const buildUserProfile = (data: any): UserProfile => ({
  id: String(data.profile?.id || data.user?.id),
  auth_id: String(data.profile?.auth_id || data.user?.id),
  name: data.profile?.name || data.user?.user_metadata?.name || null,
  mobile: data.profile?.mobile || data.profile?.phone || data.user?.phone || '',
  email: data.profile?.email || data.user?.email || null,
  phone: data.profile?.phone || data.user?.phone || '',
  grade: data.profile?.grade || null,
  school: data.profile?.school || null,
  profile_image_url: data.profile?.profile_image_url || null,
  date_of_birth: data.profile?.date_of_birth || null,
  gender: data.profile?.gender || null,
  preferences: data.profile?.preferences || data.user?.user_metadata || {},
  is_active: data.profile?.is_active ?? true,
  created_at: data.profile?.created_at || new Date().toISOString(),
  updated_at: data.profile?.updated_at || new Date().toISOString(),
  last_login: data.profile?.last_login || null,
});

export const localAuthService = {
  async getSession(): Promise<AuthSessionResponse> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.log('No token found in localStorage');
      return {
        session: null,
        profile: null,
      };
    }

    try {
      console.log('Fetching session with token:', token ? '***' + token.slice(-4) : 'missing');
      const response = await fetch(`${AUTH_ENDPOINT}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Session fetch failed:', response.status);
        localStorage.removeItem('auth_token');
        return {
          session: null,
          profile: null,
        };
      }

      const text = await response.text();
      console.log('Session response text:', text);
      
      if (!text || text.trim() === '') {
        console.error('Empty response from server');
        localStorage.removeItem('auth_token');
        return {
          session: null,
          profile: null,
        };
      }
      
      const data = JSON.parse(text);
      console.log('Session data received:', data);
      
      if (!data || typeof data !== 'object') {
        console.error('Invalid session data received:', data);
        localStorage.removeItem('auth_token');
        return {
          session: null,
          profile: null,
        };
      }
      
      const authUser = buildAuthUser(data);
      const userProfile = buildUserProfile(data);

      return {
        session: {
          user: authUser,
          accessToken: data.token || token,
          expiresAt: data.session?.expiresAt || null,
        },
        profile: userProfile,
      };
    } catch (error) {
      console.error('Get session error:', error);
      localStorage.removeItem('auth_token');
      return {
        session: null,
        profile: null,
      };
    }
  },

  async register(input: RegisterInput): Promise<AuthSessionResponse> {
    try {
      const response = await fetch(`${AUTH_ENDPOINT}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: input.fullName,
          phone: input.phone,
          password: input.password,
        }),
      });

      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      const authUser = buildAuthUser(data);
      const userProfile = buildUserProfile(data);

      return {
        session: {
          user: authUser,
          accessToken: data.token,
          expiresAt: data.session?.expiresAt || null,
        },
        profile: userProfile,
      };
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  async signIn(input: SignInInput): Promise<AuthSessionResponse> {
    try {
      console.log('Attempting sign in with phone:', input.phone);
      const response = await fetch(`${AUTH_ENDPOINT}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: input.phone,
          password: input.password,
        }),
      });

      const text = await response.text();
      console.log('Sign in response text:', text);
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      console.log('Sign in response:', response.status, data);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Invalid phone or password');
      }

      // Store token
      if (data.token) {
        console.log('Storing token in localStorage');
        localStorage.setItem('auth_token', data.token);
      }

      const authUser = buildAuthUser(data);
      const userProfile = buildUserProfile(data);
      console.log('Built auth user and profile:', { authUser, userProfile });

      return {
        session: {
          user: authUser,
          accessToken: data.token,
          expiresAt: data.session?.expiresAt || null,
        },
        profile: userProfile,
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Invalid phone or password');
    }
  },

  async updateProfile(input: UpdateProfileInput): Promise<AuthSessionResponse> {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await fetch(`${AUTH_ENDPOINT}/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: input.name,
          email: input.email,
        }),
      });

      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      const authUser = buildAuthUser(data);
      const userProfile = buildUserProfile(data);

      return {
        session: {
          user: authUser,
          accessToken: data.token || token,
          expiresAt: data.session?.expiresAt || null,
        },
        profile: userProfile,
      };
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  },

  async signOut(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${AUTH_ENDPOINT}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem('auth_token');
    }
  },
};

export default localAuthService;
