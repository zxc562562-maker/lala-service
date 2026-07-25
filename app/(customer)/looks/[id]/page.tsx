import { notFound, redirect } from 'next/navigation';
import { getLook, getLookImages } from '@/lib/looks';
import { getCachedUser } from '@lala/shared/lib/auth-cache';
import LookGallery from '@/components/LookGallery';

export const dynamic = 'force-dynamic';

export default async function LookPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const look = await getLook(params.id);
  if (!look) notFound();

  const user = await getCachedUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/looks/${params.id}`)}`);

  return (
    <section className="look-detail">
      <LookGallery images={getLookImages(look)} />
    </section>
  );
}
