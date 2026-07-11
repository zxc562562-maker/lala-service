import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/account-actions';
import ProfileForm from '@/components/ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect('/login?next=/profile');
  return <ProfileForm profile={profile} />;
}
