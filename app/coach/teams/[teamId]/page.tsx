// app/coach/teams/[teamId]/page.tsx
import TeamPlayersClient from './TeamPlayersClient';

type PageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamPlayersPage({ params }: PageProps) {
  const { teamId } = await params;
  return <TeamPlayersClient teamId={teamId} />;
}
