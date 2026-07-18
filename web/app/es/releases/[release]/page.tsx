import ReleaseDetailPage, {
  generateStaticParams,
} from "@/app/releases/[release]/page";
import { cases } from "@/lib/data";
import { esMeta } from "@/lib/seo";

export { generateStaticParams };

const pad = (n: number) => String(n).padStart(2, "0");

export async function generateMetadata(props: {
  params: Promise<{ release: string }>;
}) {
  const { release } = await props.params;
  const n = Number(release);
  if (!Number.isFinite(n)) return {};
  const count = cases.filter((c) => c.pursueReleases?.includes(n)).length;
  return esMeta({
    title: `Release PURSUE ${pad(n)} — ${count} casos del corpus`,
    description: `Los ${count} casos de UAP Codex que citan documentos del Release ${pad(n)} de PURSUE/AARO (desclasificación del Department of War).`,
    enPath: `/releases/${pad(n)}/`,
  });
}

export default ReleaseDetailPage;
