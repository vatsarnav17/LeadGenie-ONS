
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixukxtewedbasqgnfqkp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4dWt4dGV3ZWRiYXNxZ25mcWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Mzg3MTEsImV4cCI6MjA4MzUxNDcxMX0.Sj_3CjC6u2JA0SuSR3fzh0LolU4_tBfjdtsk_WUX7dk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
