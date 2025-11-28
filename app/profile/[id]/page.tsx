// app/profile/[id]/page.tsx
import OtherProfileClient from './OtherProfileClient';

type PageProps = {
  // In Next 15/16, params is a Promise in app router
  params: Promise<{ id: string }>;
};

export default async function OtherProfilePage({ params }: PageProps) {
  // ✅ Await params before using
  const { id } = await params;

  return <OtherProfileClient userId={id} />;
}
