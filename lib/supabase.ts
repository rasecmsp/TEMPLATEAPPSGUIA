import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    const msg = 'ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas. Verifique se o arquivo .env existe e contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.';
    console.error(msg);
    alert(msg);
    // Use fallback to prevent immediate crash, though calls will fail
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});
