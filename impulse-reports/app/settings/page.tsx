import SettingsForm from "@/components/SettingsForm";
import { supabaseServer } from "@/lib/supabase/server";
import type { Settings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("settings").select("*").maybeSingle();
  const settings = data as Settings | null;

  let logoUrl: string | null = null;
  if (settings?.logo_path) {
    const { data: signed } = await supabase.storage
      .from("logos")
      .createSignedUrl(settings.logo_path, 60 * 60);
    logoUrl = signed?.signedUrl ?? null;
  }

  return <SettingsForm initialSettings={settings} initialLogoUrl={logoUrl} />;
}
