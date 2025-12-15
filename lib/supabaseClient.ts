
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project URL and Anon Key
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zbwrugxyuqmokuanwugx.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpid3J1Z3h5dXFtb2t1YW53dWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDkyMzksImV4cCI6MjA4MTI4NTIzOX0.WephkVYuSYg9PuktydvaczN-hsLd3xJKQj3uvNkUCw4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
