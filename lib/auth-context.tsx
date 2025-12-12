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
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
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
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state
      setSession(null);
      setUser(null);
      setUserProfile(null);
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use the app scheme for deep linking (nftgo://)
      // In Supabase Dashboard, use: nftgo:// (or nftgo://* for wildcard)
      // This must match what's configured in Supabase Dashboard → Authentication → URL Configuration
      const redirectUrl = 'nftgo://';
      
      console.log('🔐 Google OAuth redirect URL:', redirectUrl);
      console.log('🔐 Supabase Base URL:', Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'NOT SET');
      
      // Verify Supabase client is properly configured by checking if we have URL and key
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase credentials missing for OAuth');
        return {
          error: {
            message: 'Supabase is not properly configured. Please check your environment variables and rebuild the app.',
            code: 'SUPABASE_NOT_CONFIGURED'
          }
        };
      }
      
      let data, error;
      try {
        const result = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: false,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        data = result.data;
        error = result.error;
      } catch (fetchError: any) {
        // If it's a network/fetch error, wrap it
        if (fetchError?.name === 'TypeError' || fetchError?.message?.includes('fetch')) {
          error = {
            name: 'AuthRetryableFetchError',
            message: fetchError?.message || 'Network request failed',
            status: 0,
          };
        } else {
          error = fetchError;
        }
      }

      if (error) {
        // Handle network/fetch errors (status 0)
        if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
          return {
            error: {
              message: 'Network error: Unable to reach authentication server. Please check your internet connection and try again.',
              code: 'NETWORK_ERROR',
              originalError: error.message || error.name,
              details: 'This usually means the app cannot connect to Supabase servers, or Supabase returned an unexpected response format.'
            }
          };
        }
        
        // Handle JSON parse errors
        if (error.message?.includes('JSON Parse error') || error.message?.includes('Unexpected character')) {
          return {
            error: {
              message: 'Server configuration error. The authentication server returned an invalid response. Please verify Supabase OAuth is properly configured in the dashboard.',
              code: 'JSON_PARSE_ERROR',
              originalError: error.message,
              details: 'This usually means Supabase returned HTML or plain text instead of JSON. Check Supabase dashboard configuration.'
            }
          };
        }
        
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
              }
            }
          }
        }
      }

      if (!data?.url) {
        return {
          error: {
            message: 'Failed to get OAuth URL from authentication server. Please verify Supabase OAuth configuration.',
            code: 'NO_OAUTH_URL'
          }
        };
      }
      
      return { error: null };
    } catch (error: any) {
      // Handle network/fetch errors
      if (error?.status === 0 || error?.name === 'AuthRetryableFetchError' || error?.name === 'TypeError') {
        return {
          error: {
            message: 'Network error: Unable to connect to authentication server. Please check your internet connection and Supabase configuration.',
            code: 'NETWORK_ERROR',
            originalError: error?.message || error?.name
          }
        };
      }
      
      // Handle JSON parse errors from catch block
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('JSON Parse error') || errorMessage.includes('Unexpected character')) {
        return {
          error: {
            message: 'Authentication server returned an invalid response. Please verify Supabase OAuth is properly configured and try again.',
            code: 'JSON_PARSE_ERROR',
            originalError: errorMessage
          }
        };
      }
      
      return { 
        error: { 
          message: errorMessage || 'An unexpected error occurred during Google sign in',
          code: 'UNKNOWN_ERROR'
        } 
      };
    }
  };

  const signInWithApple = async (identityToken: string, nonce?: string) => {
    try {
      // Use the app scheme for deep linking (nftgo://)
      const redirectUrl = 'nftgo://';
      
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

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = 'nftgo://reset-password';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { error: { message: error.message || 'Failed to send password reset email' } };
    }
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
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
    resetPassword,
    refreshUserProfile,
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

