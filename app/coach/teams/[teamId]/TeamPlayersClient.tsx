// app/coach/teams/[teamId]/TeamPlayersClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Section from '@/components/ui/Section';
import { cn } from '@/lib/utils';

type TeamInfo = {
  id: string;
  name: string;
  age_group?: string | number | null;
  org_name?: string | null;
};

type Player = {
  id: string;
  username: string;
  handle?: string | null;
};

type DraftFeedback = {
  id: string;
  player_id: string;
  body: string;
  status: 'draft' | 'submitted';
  created_at: string;
};

type Props = {
  teamId: string;
};

function formatAgeLabel(age?: string | number | null) {
  if (age === null || age === undefined) return null;
  const str = String(age);
  return str.toUpperCase().endsWith('U') ? str : `${str}U`;
}

export default function TeamPlayersClient({ teamId }: Props) {
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [saving, setSaving] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [playerDrafts, setPlayerDrafts] = useState<Record<string, DraftFeedback>>({});
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  const routeParams = useParams<{ teamId?: string }>();
  const effectiveTeamId = useMemo(
    () => teamId || routeParams?.teamId || '',
    [teamId, routeParams?.teamId]
  );

  useEffect(() => {
    async function load() {
      if (!effectiveTeamId) {
        setError('Missing team id');
        setTeam(null);
        setPlayers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/coach/teams/${effectiveTeamId}/players`);
        if (!res.ok) {
          const text = await res.text();
          setError(text || 'Failed to load team');
          setTeam(null);
          setPlayers([]);
          return;
        }
        const data = await res.json();
        setTeam(data.team ?? null);
        setPlayers((data.players || []) as Player[]);
      } catch (err: any) {
        setError(err?.message || 'Network error');
        setTeam(null);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [effectiveTeamId]);

  // Load coach id from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('levelup_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCoachId(parsed?.id ?? null);
      }
    } catch {
      setCoachId(null);
    }
  }, []);

  useEffect(() => {
    async function loadDrafts() {
      if (!coachId || players.length === 0) return;
      setLoadingDrafts(true);
      try {
        const playerIds = players.map((p) => p.id).join(',');
        const res = await fetch(
          `/api/feedback/drafts?coachId=${coachId}&playerIds=${playerIds}`
        );
        if (!res.ok) {
          console.error('Failed to load drafts', await res.text());
          return;
        }
        const data = await res.json();
        const map = (data.drafts || []).reduce(
          (acc: Record<string, DraftFeedback>, draft: DraftFeedback) => {
            acc[draft.player_id] = draft;
            return acc;
          },
          {}
        );
        setPlayerDrafts(map);
      } catch (err) {
        console.error('Error loading drafts', err);
      } finally {
        setLoadingDrafts(false);
      }
    }

    loadDrafts();
  }, [coachId, players]);

  const ageLabel = formatAgeLabel(team?.age_group);
  const title = [team?.name, ageLabel].filter(Boolean).join(' ');

  const openFeedback = (player: Player) => {
    setSelectedPlayer(player);
    const existingDraft = playerDrafts[player.id];
    setFeedbackText(existingDraft?.body || '');
    setCurrentDraftId(existingDraft?.id || null);
    setSheetError(null);
    setFeedbackOpen(true);
  };

  const closeFeedback = () => {
    setFeedbackOpen(false);
    setSaving(false);
    setSheetError(null);
    setSelectedPlayer(null);
    setCurrentDraftId(null);
    setFeedbackText('');
  };

  const handleSave = async (action: 'save' | 'submit') => {
    if (!selectedPlayer) return;
    if (!coachId) {
      setSheetError('Missing coach id');
      return;
    }
    if (!feedbackText.trim()) {
      setSheetError('Please enter feedback before submitting.');
      return;
    }
    setSaving(true);
    setSheetError(null);
    const status = action === 'save' ? 'draft' : 'submitted';

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId,
          playerId: selectedPlayer.id,
          body: feedbackText,
          status,
          feedbackId: currentDraftId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Could not save feedback');
      }

      if (status === 'draft') {
        const draftId = data?.id || currentDraftId || '';
        setPlayerDrafts((prev) => ({
          ...prev,
          [selectedPlayer.id]: {
            id: draftId,
            player_id: selectedPlayer.id,
            body: feedbackText,
            status: 'draft',
            created_at:
              prev[selectedPlayer.id]?.created_at || new Date().toISOString(),
          },
        }));
        setCurrentDraftId(draftId);
      } else {
        setPlayerDrafts((prev) => {
          const next = { ...prev };
          delete next[selectedPlayer.id];
          return next;
        });
        setCurrentDraftId(null);
      }

      if (status === 'submitted') {
        setFeedbackText('');
      }

      closeFeedback();
    } catch (err: any) {
      setSheetError(err?.message || 'Could not save feedback');
    } finally {
      setSaving(false);
    }
  };

  // Prevent background scroll while sheet is open
  useEffect(() => {
    if (!feedbackOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [feedbackOpen]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="sticky top-0 z-20 w-full py-4 bg-black/80 backdrop-blur border-b border-white/10 shadow flex items-center justify-between px-4">
        <Link
          href="/profile"
          className="text-sm text-white/70 hover:text-white flex items-center gap-1"
        >
          <span className="text-lg">←</span>
          <span>Profile</span>
        </Link>

        <h1 className="text-lg font-semibold tracking-tight">
          {title || 'Team'}
        </h1>

        <div className="w-[72px]" />
      </header>

      <main className="flex-1 w-full px-4 py-6 max-w-2xl mx-auto space-y-6">
        <Section title="Roster">
          {error && (
            <p className="text-sm text-red-400">
              Failed to load team: {error}
            </p>
          )}

          {loading ? (
            <p className="text-base text-white/60">Loading players…</p>
          ) : !team ? (
            <p className="text-base text-white/60">Team not found.</p>
          ) : players.length === 0 ? (
            <p className="text-base text-white/60">No players on this team yet.</p>
          ) : (
            <ul className="space-y-4">
              {loadingDrafts && (
                <li className="text-xs text-white/50">
                  Checking for saved drafts…
                </li>
              )}
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center gap-3 border-b border-white/15 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1">
                    <span className="text-base font-semibold text-white">
                      {player.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {playerDrafts[player.id] && (
                      <button
                        type="button"
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold',
                          'border border-lime-300/60 text-lime-200',
                          'bg-white/5 hover:bg-white/10 transition',
                          'active:scale-95'
                        )}
                        onClick={() => openFeedback(player)}
                      >
                        Edit Draft
                      </button>
                    )}

                    <button
                      type="button"
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold',
                        'bg-lime-400 text-black transition',
                        'hover:bg-lime-300 active:scale-95'
                      )}
                      onClick={() => openFeedback(player)}
                    >
                      Give Feedback
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {feedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <button
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeFeedback}
            />

            {/* Sheet */}
            <div
              className="
                relative z-50 w-full max-w-md h-full
                rounded-none flex flex-col
                bg-white/5 backdrop-blur-xl
                border border-white/10
                shadow-[0_-20px_60px_rgba(0,0,0,0.9)]
                px-6 pt-5 pb-7
              "
            >
              <h2 className="mb-4 text-center text-xl font-bold uppercase tracking-wide text-white">
                Give Feedback
              </h2>
              {currentDraftId && (
                <p className="text-center text-xs font-semibold uppercase tracking-wide text-lime-200">
                  Resuming draft
                </p>
              )}
              {selectedPlayer && (
                <p className="mb-4 mt-1 text-center text-white/70 text-lg">
                  to <span className="text-white font-semibold">{selectedPlayer.username}</span>
                </p>
              )}

              <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="
                      h-full min-h-[320px]
                      w-full rounded-2xl border border-white/15 bg-black/40
                      px-3 py-3 text-white placeholder-white/40
                      focus:outline-none focus:border-lime-400
                      resize-none
                    "
                    placeholder="Share observations, drills to focus on, or encouragement…"
                  />
                </div>

                {sheetError && (
                  <p className="text-center text-sm text-red-400">
                    {sheetError}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeFeedback}
                      disabled={saving}
                      className="
                        flex-1 rounded-full border border-white/20
                        bg-transparent px-4 py-2 text-sm font-medium
                        text-white hover:bg-white/10 transition
                        disabled:opacity-40
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSave('save')}
                      disabled={saving}
                      className="
                        flex-1 rounded-full px-4 py-2
                        bg-white text-black font-semibold
                        border border-white/20
                        hover:bg-white/90 transition
                        disabled:opacity-50
                      "
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSave('submit')}
                    disabled={saving}
                    className="
                      w-full rounded-full px-4 py-2
                      bg-lime-400 text-black font-semibold
                      hover:bg-lime-300 transition
                      disabled:opacity-50
                    "
                  >
                    {saving ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
