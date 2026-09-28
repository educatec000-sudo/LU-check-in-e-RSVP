// Supabase — Portal do Casal (chaves integradas ✅)
// A chave "anon/public" é feita para ficar no código do site —
// a segurança vem das regras do banco (RLS), já incluídas no schema.sql.
export const SUPABASE_URL = "https://fhsjpazugkupirnahcvu.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoc2pwYXp1Z2t1cGlybmFoY3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1OTA5MzQsImV4cCI6MjEwNjE2NjkzNH0.CYMGcIuiKsyex5CJgBnIgbbX6ftSqVWVw2PpF2ZEcxM";

export const CONFIG_OK =
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 40;
