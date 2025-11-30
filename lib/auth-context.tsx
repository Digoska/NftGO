import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { User } from '../types';

// Complete OAuth session in Expo
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
      signInWithApple: (identityToken: string, nonce?: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthProvider: Initializing...');
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    console.log('🔍 Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('🔍 Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
      }
      console.log('🔍 Initial session:', session ? '✅ Found' : '❌ No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🔍 User found:', session.user.email);
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 Auth state changed:', event);
      console.log('🔍 Session:', session ? '✅ Active' : '❌ No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🔍 User:', session.user.email);
        fetchUserProfile(session.user.id);
      } else {
        console.log('🔍 No user, clearing profile');
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - we'll create profile on first login
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      } else {
        // Create user profile if it doesn't exist
        const { data: newProfile } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: user?.email,
          })
          .select()
          .single();

        if (newProfile) {
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting to sign in with email:', email);
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      console.log('🔐 Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
      console.log('🔐 Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error status:', error.status);
        return { error };
      }
      
      if (data?.session) {
        console.log('✅ Sign in successful!');
        console.log('✅ User ID:', data.session.user.id);
        console.log('✅ User email:', data.session.user.email);
      } else {
        console.warn('⚠️ Sign in returned no session');
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      return { error: { message: error.message || 'Unexpected error occurred' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const signInWithGoogle = async () => {
    try {
      // Use the app scheme for deep linking (nftgo://)
      // This must match what's configured in Supabase Dashboard → Authentication → URL Configuration
      const redirectUrl = 'nftgo://';
      
      console.log('🔐 Google OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        // If OAuth is not configured, provide helpful error
        if (error.message?.includes('missing OAuth secret') || error.message?.includes('Unsupported provider')) {
          return { 
            error: { 
              message: 'Google Sign In is not configured in Supabase. Please configure OAuth in your Supabase dashboard.',
              code: 'OAUTH_NOT_CONFIGURED'
            } 
          };
        }
        return { error };
      }

      // Open the OAuth URL in browser
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success') {
          // Extract the URL from the result
          const url = result.url;
          if (url) {
            // Supabase OAuth callback format: nftgo://#access_token=...&refresh_token=...
            // We need to extract hash fragment, not query params
            const hashMatch = url.match(/#(.+)/);
            if (hashMatch) {
              const hashParams = new URLSearchParams(hashMatch[1]);
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');
              
              if (accessToken && refreshToken) {
                // Set the session manually
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                
                if (sessionError) {
                  return { error: sessionError };
                }
              }
            } else {
              // Try query params as fallback
              try {
                const urlObj = new URL(url);
                const accessToken = urlObj.searchParams.get('access_token');
                const refreshToken = urlObj.searchParams.get('refresh_token');
                
                if (accessToken && refreshToken) {
                  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                  
                  if (sessionError) {
                    return { error: sessionError };
                  }
                }
              } catch (e) {
                // URL parsing failed, let Supabase handle it automatically
                console.log('Could not parse OAuth callback URL, waiting for automatic session...');
              }
            }
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithApple = async (identityToken: string, nonce?: string) => {
    try {
      // Use the app scheme for deep linking (nftgo://)
      const redirectUrl = 'nftgo://';
      
      console.log('🔐 Apple OAuth redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('Apple OAuth error:', error);
        // If OAuth is not configured, provide helpful error
        if (error.message?.includes('missing OAuth secret') || error.message?.includes('Unsupported provider')) {
          return { 
            error: { 
              message: 'Apple Sign In is not configured in Supabase. Please configure OAuth in your Supabase dashboard.',
              code: 'OAUTH_NOT_CONFIGURED'
            } 
          };
        }
        return { error };
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (result.type === 'success' && result.url) {
          const hashMatch = result.url.match(/#(.+)/);
          if (hashMatch) {
            const hashParams = new URLSearchParams(hashMatch[1]);
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (sessionError) {
                return { error: sessionError };
              }
            }
          }
        } else if (result.type === 'cancel') {
          return { error: { message: 'Apple Sign In was cancelled' } };
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Apple sign in exception:', error);
      return { error: { message: error.message || 'Apple sign in failed' } };
    }
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
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

