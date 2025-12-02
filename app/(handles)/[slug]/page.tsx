// app/(handles)/[slug]/page.tsx
import { notFound } from 'next/navigation';
import ProfileClient from '../../profile/ProfileClient';

type PageProps = {
  // In Next 15/16, params is a Promise in app router
  params: Promise<{ slug: string }>;
};

// Avoid hijacking system or reserved routes
const RESERVED_SLUGS = new Set([
  '',
  'api',
  'profile',
  'coach',
  'auth',
  'login',
  'logout',
  'signup',
  'admin',
  'teams',
  'team',
  'settings',
  '_next',
  'static',
  'public',
  'favicon.ico',
]);

export default async function HandleProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const normalized = (slug || '').trim();

  if (!normalized || RESERVED_SLUGS.has(normalized.toLowerCase())) {
    notFound();
  }

  return (
    <ProfileClient initialHandle={normalized} initialUserId={normalized} />
  );
}
