import { supabase } from "./client";

export async function verifySupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from("checklist_templates").select("id").limit(1);
    if (error) {
      return { ok: false, message: `Erro na consulta: ${error.message}` };
    }
    return { ok: true, message: "Conexão Supabase OK" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  }
}



