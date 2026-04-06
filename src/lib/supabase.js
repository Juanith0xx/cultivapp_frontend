import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pxyrjjflctoajaezodsq.supabase.co';
// Esta es tu clave pública (anon key)
const supabaseKey = 'sb_publishable_ImZGwRW_E9-ICYfOxbe9TA_asTLt51Z'; 

export const supabase = createClient(supabaseUrl, supabaseKey);