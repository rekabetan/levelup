// app/admin/AdminDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ActiveUsersTrendCard from './ActiveUsersTrendCard';

// Reuse the same upward arrow icon from the main UI
function ArrowUpIcon() {
  return (
    <svg
      className="inline-block text-lime-400 align-middle -ml-[2px]"
      width="24"
      height="24"
      viewBox="0 0 24 22"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 20V10H4L12 1L20 10H15V20H9Z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.5 4.5L8 10l4.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 4.5L12 10l-4.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  const [dailyActiveUsers, setDailyActiveUsers] = useState<number | null>(null);
  const [weeklyActiveUsers, setWeeklyActiveUsers] = useState<number | null>(
    null
  );
  const [monthlyActiveUsers, setMonthlyActiveUsers] = useState<number | null>(
    null
  );

  const [dailyNewUsers, setDailyNewUsers] = useState<number | null>(null);
  const [weeklyNewUsers, setWeeklyNewUsers] = useState<number | null>(null);
  const [monthlyNewUsers, setMonthlyNewUsers] = useState<number | null>(null);

  const [dailyLogs, setDailyLogs] = useState<number | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<number | null>(null);
  const [monthlyLogs, setMonthlyLogs] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const res = await fetch('/api/admin/stats');
        if (!res.ok) {
          throw new Error('Failed to fetch admin stats');
        }

        const data = await res.json();

        setTotalUsers(data.totalUsers ?? 0);

        setDailyActiveUsers(data.dailyActiveUsers ?? 0);
        setWeeklyActiveUsers(data.weeklyActiveUsers ?? 0);
        setMonthlyActiveUsers(data.monthlyActiveUsers ?? 0);

        setDailyNewUsers(data.dailyNewUsers ?? 0);
        setWeeklyNewUsers(data.weeklyNewUsers ?? 0);
        setMonthlyNewUsers(data.monthlyNewUsers ?? 0);

        setDailyLogs(data.dailyLogs ?? 0);
        setWeeklyLogs(data.weeklyLogs ?? 0);
        setMonthlyLogs(data.monthlyLogs ?? 0);
      } catch (err) {
        console.error('Failed to load admin stats', err);

        setTotalUsers(null);

        setDailyActiveUsers(null);
        setWeeklyActiveUsers(null);
        setMonthlyActiveUsers(null);

        setDailyNewUsers(null);
        setWeeklyNewUsers(null);
        setMonthlyNewUsers(null);

        setDailyLogs(null);
        setWeeklyLogs(null);
        setMonthlyLogs(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col gap-6">

        <div className="grid gap-6 md:grid-cols-2">
          <ActiveUsersTrendCard />
          {/* you can add another trend card later, e.g. Logs trend */}
        </div>

        {/* GRID FOR CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <TotalUsersCard total={totalUsers} loading={loading} />
          <ActiveUsersCarouselCard
            daily={dailyActiveUsers}
            weekly={weeklyActiveUsers}
            monthly={monthlyActiveUsers}
            loading={loading}
          />
          <NewUsersCarouselCard
            daily={dailyNewUsers}
            weekly={weeklyNewUsers}
            monthly={monthlyNewUsers}
            loading={loading}
          />
          <LogsCarouselCard
            daily={dailyLogs}
            weekly={weeklyLogs}
            monthly={monthlyLogs}
            loading={loading}
          />
          <AvgLogsPerActiveUserCard
            dailyLogs={dailyLogs}
            weeklyLogs={weeklyLogs}
            monthlyLogs={monthlyLogs}
            dailyActive={dailyActiveUsers}
            weeklyActive={weeklyActiveUsers}
            monthlyActive={monthlyActiveUsers}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------- */
/*             SHARED METRIC CARD              */
/* ------------------------------------------- */

type MetricCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

function MetricCard({ title, subtitle, children }: MetricCardProps) {
  return (
    <div className="relative w-full min-w-[160px] min-h-[200px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/70 flex flex-col items-center text-white p-4">
      {/* Title + optional subtitle */}
      <div className="w-full text-center mb-4">
        <div className="text-xl font-bold uppercase tracking-wide mb-3 w-full">
          {title}
        </div>
        {subtitle && (
          <div className="text-md font-bold uppercase text-white/80 mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

/* ------------------------------------------- */
/*                TOTAL USERS CARD             */
/* ------------------------------------------- */

function TotalUsersCard({
  total,
  loading,
}: {
  total: number | null;
  loading: boolean;
}) {
  return (
    <MetricCard title="Total Users">
      <div>
        <div className="text-7xl font-black text-lime-400 leading-none text-center">
          {loading ? '—' : total}
        </div>
      </div>
    </MetricCard>
  );
}

/* ------------------------------------------- */
/*          ACTIVE USERS CAROUSEL CARD         */
/* ------------------------------------------- */

type ActiveUsersCarouselCardProps = {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
  loading: boolean;
};

function ActiveUsersCarouselCard({
  daily,
  weekly,
  monthly,
  loading,
}: ActiveUsersCarouselCardProps) {
  const slides = [
    { label: 'Daily', value: daily },
    { label: 'Weekly', value: weekly },
    { label: 'Monthly', value: monthly },
  ];

  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const current = slides[index];

  const goTo = (i: number) => {
    setIndex((i + slides.length) % slides.length);
  };

  const goNext = () => goTo(index + 1);
  const goPrev = () => goTo(index - 1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;

    const diff = e.changedTouches[0].clientX - touchStartX;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setTouchStartX(null);
  };

  return (
    <MetricCard title="Active Users" subtitle={current.label}>
      <div
        className="flex-1 flex items-center justify-center mb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items_center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous metric"
          >
            <ChevronLeftIcon />
          </button>

          <div className="text-7xl font-black text-lime-400 leading-none min-w-[3ch] text-center">
            {loading ? '—' : current.value}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next metric"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center justify-center mt-auto">
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-lime-400' : 'w-2.5 bg-white/30'
            }`}
            aria-label={slide.label}
          />
        ))}
      </div>
    </MetricCard>
  );
}

/* ------------------------------------------- */
/*          NEW USERS CAROUSEL CARD            */
/* ------------------------------------------- */

type NewUsersCarouselCardProps = {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
  loading: boolean;
};

function NewUsersCarouselCard({
  daily,
  weekly,
  monthly,
  loading,
}: NewUsersCarouselCardProps) {
  const slides = [
    { label: 'Daily', value: daily },
    { label: 'Weekly', value: weekly },
    { label: 'Monthly', value: monthly },
  ];

  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const current = slides[index];

  const goTo = (i: number) => {
    setIndex((i + slides.length) % slides.length);
  };

  const goNext = () => goTo(index + 1);
  const goPrev = () => goTo(index - 1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;

    const diff = e.changedTouches[0].clientX - touchStartX;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setTouchStartX(null);
  };

  return (
    <MetricCard title="New Users" subtitle={current.label}>
      <div
        className="flex-1 flex items-center justify-center mb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous metric"
          >
            <ChevronLeftIcon />
          </button>

          <div className="text-7xl font-black text-lime-400 leading-none min-w-[3ch] text-center">
            {loading ? '—' : current.value}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next metric"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center justify-center mt-auto">
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-lime-400' : 'w-2.5 bg-white/30'
            }`}
            aria-label={slide.label}
          />
        ))}
      </div>
    </MetricCard>
  );
}

/* ------------------------------------------- */
/*           LOGS CAROUSEL CARD                */
/* ------------------------------------------- */

type LogsCarouselCardProps = {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
  loading: boolean;
};

function LogsCarouselCard({
  daily,
  weekly,
  monthly,
  loading,
}: LogsCarouselCardProps) {
  const slides = [
    { label: 'Daily', value: daily },
    { label: 'Weekly', value: weekly },
    { label: 'Monthly', value: monthly },
  ];

  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const current = slides[index];

  const goTo = (i: number) => {
    setIndex((i + slides.length) % slides.length);
  };

  const goNext = () => goTo(index + 1);
  const goPrev = () => goTo(index - 1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;

    const diff = e.changedTouches[0].clientX - touchStartX;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setTouchStartX(null);
  };

  return (
    <MetricCard title="Logs" subtitle={current.label}>
      <div
        className="flex-1 flex items-center justify-center mb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous metric"
          >
            <ChevronLeftIcon />
          </button>

          <div className="text-7xl font-black text-lime-400 leading-none min-w-[3ch] text-center">
            {loading ? '—' : current.value}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next metric"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center justify-center mt-auto">
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-lime-400' : 'w-2.5 bg-white/30'
            }`}
            aria-label={slide.label}
          />
        ))}
      </div>
    </MetricCard>
  );
}

/* ------------------------------------------- */
/*   AVG LOGS PER ACTIVE USER CAROUSEL CARD    */
/* ------------------------------------------- */

type AvgLogsPerActiveUserCardProps = {
  dailyLogs: number | null;
  weeklyLogs: number | null;
  monthlyLogs: number | null;
  dailyActive: number | null;
  weeklyActive: number | null;
  monthlyActive: number | null;
  loading: boolean;
};

function AvgLogsPerActiveUserCard({
  dailyLogs,
  weeklyLogs,
  monthlyLogs,
  dailyActive,
  weeklyActive,
  monthlyActive,
  loading,
}: AvgLogsPerActiveUserCardProps) {
  const slides = [
    { label: 'Daily', logs: dailyLogs, active: dailyActive },
    { label: 'Weekly', logs: weeklyLogs, active: weeklyActive },
    { label: 'Monthly', logs: monthlyLogs, active: monthlyActive },
  ];

  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const current = slides[index];

  // Compute average safely
  const avgValue = (() => {
    if (
      current.logs == null ||
      current.active == null ||
      current.active === 0
    ) {
      return null;
    }
    const raw = current.logs / current.active;
    return Number.isFinite(raw) ? Number(raw.toFixed(2)) : null;
  })();

  const goTo = (i: number) => {
    setIndex((i + slides.length) % slides.length);
  };

  const goNext = () => goTo(index + 1);
  const goPrev = () => goTo(index - 1);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX == null) return;

    const diff = e.changedTouches[0].clientX - touchStartX;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setTouchStartX(null);
  };

  return (
    <MetricCard title="Logs / AU" subtitle={current.label}>
      <div
        className="flex-1 flex items-center justify-center mb-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous metric"
          >
            <ChevronLeftIcon />
          </button>

          <div className="text-6xl font-black text-lime-400 leading-none min-w-[4ch] text-center">
            {loading || avgValue == null ? '—' : avgValue}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/20 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next metric"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center justify-center mt-auto">
        {slides.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-lime-400' : 'w-2.5 bg-white/30'
            }`}
            aria-label={slide.label}
          />
        ))}
      </div>
    </MetricCard>
  );
}
