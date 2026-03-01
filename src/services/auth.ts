import { supabase } from '../lib/supabase';

export const authService = {
  async signIn(email: string, pass: string) {
    // Tenta fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};