// Configuração do cliente Supabase
// Substitua os valores abaixo pelas credenciais do seu projeto Supabase

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

import { createClient } from '@supabase/supabase-js';

console.log('Supabase client initialized with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
