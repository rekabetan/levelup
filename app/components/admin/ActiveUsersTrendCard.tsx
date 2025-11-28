// app/components/admin/ActiveUsersTrendCard.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AdminMetricCard from './AdminMetricCard';

type Point = {
  day: string;
  label: string;
  value: number;
};

export default function ActiveUsersTrendCard() {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/admin/active-users-trend');
        if (!res.ok) {
          throw new Error('Failed to load');
        }
        const json = await res.json();
        if (!cancelled) {
          setPoints(json.points ?? []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Error loading data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminMetricCard title="Active Users" subtitle="7-Day Trend">
      {loading && (
        <div className="text-xs text-slate-400">Loading trend…</div>
      )}

      {!loading && error && (
        <div className="text-xs text-red-400">{error}</div>
      )}

      {!loading && !error && points.length === 0 && (
        <div className="text-xs text-slate-400">
          No data for the last 7 days.
        </div>
      )}

      {!loading && !error && points.length > 0 && (
        <div className="w-full h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid
                stroke="#171717"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#1f2933' }}
                tickLine={{ stroke: '#1f2933' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: '#1f2933' }}
                tickLine={{ stroke: '#1f2933' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderRadius: 12,
                  border: '1px solid #1f2937',
                  padding: '6px 8px',
                  fontSize: 11,
                  color: '#e5e7eb',
                }}
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: any) => [`${value} active`, 'Users']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#bef264" // lime-ish to match your accent
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 1, stroke: '#bef264' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminMetricCard>
  );
}
