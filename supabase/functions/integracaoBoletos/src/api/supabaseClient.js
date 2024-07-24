import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { config } from '../config.js';

const supabase = createClient(config.supabase.url, config.supabase.key);

export { supabase };
