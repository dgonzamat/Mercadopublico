import ReleaseDetailPage, {
  generateStaticParams,
} from "@/app/releases/[release]/page";
import { cases } from "@/lib/data";
import { enMeta } from "@/lib/seo";

export { generateStaticParams };

const pad = (n: number) => String(n).padStart(2, "0");

export async function generateMetadata(props: {
  params: Promise<{ release: string }>;
}) {
  const { release } = await props.params;
  const n = Number(release);
  if (!Number.isFinite(n)) return {};
  const count = cases.filter((c) => c.pursueReleases?.includes(n)).length;
  return enMeta({
    title: `PURSUE Release ${pad(n)} — ${count} corpus cases`,
    description: `The ${count} UAP Codex cases that cite documents from PURSUE/AARO Release ${pad(n)} (Department of War declassification).`,
    esPath: `/releases/${pad(n)}/`,
  });
}

export default ReleaseDetailPage;
