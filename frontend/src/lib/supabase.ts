import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

if (!supabaseKey) {
  throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      transport: ws,
    },
  }
);
