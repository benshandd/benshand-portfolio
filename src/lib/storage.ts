import { createClient } from "@supabase/supabase-js";

import { serverEnv } from "@/env/server";

const supabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

export function getSupabaseAdminClient() {
  return supabase;
}
