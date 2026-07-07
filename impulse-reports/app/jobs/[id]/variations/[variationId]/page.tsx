import { notFound } from "next/navigation";
import VariationEditor from "@/components/VariationEditor";
import { supabaseServer } from "@/lib/supabase/server";
import type { Variation } from "@/lib/types";

export default async function VariationPage({
  params,
}: {
  params: Promise<{ id: string; variationId: string }>;
}) {
  const { id, variationId } = await params;
  const supabase = await supabaseServer();

  const { data } = await supabase
    .from("variations")
    .select("*")
    .eq("id", variationId)
    .eq("job_id", id)
    .maybeSingle();

  const variation = data as Variation | null;
  if (!variation) notFound();

  let signatureUrl: string | null = null;
  if (variation.signature_path) {
    const { data: signed } = await supabase.storage
      .from("signatures")
      .createSignedUrl(variation.signature_path, 60 * 60);
    signatureUrl = signed?.signedUrl ?? null;
  }

  return (
    <VariationEditor initialVariation={variation} signatureUrl={signatureUrl} />
  );
}
