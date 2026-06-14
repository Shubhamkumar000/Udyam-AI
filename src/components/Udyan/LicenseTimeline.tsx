import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import type { License } from '../../utils/udyanStorage';

interface LicenseTimelineProps {
  licenses: License[];
}

const MS_PER_DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getStatusTheme(status: License['status']) {
  if (status === 'Active') {
    return {
      bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      barGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500 border-emerald-200',
      card: 'border-emerald-200 bg-emerald-50/80',
      icon: 'text-emerald-600 bg-emerald-100',
      label: 'Active',
    };
  }
  if (status === 'Expiring Soon') {
    return {
      bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
      barGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 border-amber-200',
      card: 'border-amber-200 bg-amber-50/80',
      icon: 'text-amber-600 bg-amber-100',
      label: 'Expiring Soon',
    };
  }
  return {
    bar: 'bg-gradient-to-r from-red-400 to-red-500',
    barGlow: 'shadow-[0_0_12px_rgba(239,68,68,0.35)]',
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500 border-red-200',
    card: 'border-red-200 bg-red-50/80',
    icon: 'text-red-600 bg-red-100',
    label: 'Expired',
  };
}

type AxisTick = { date: Date; percent: number; label: string; isMajor: boolean };

function getSmartAxisTicks(min: Date, max: Date, toPercent: (d: Date) => number): AxisTick[] {
  const spanMs = max.getTime() - min.getTime();
  const spanYears = spanMs / (365.25 * MS_PER_DAY);

  let stepMonths: number;
  if (spanYears > 4) stepMonths = 12;
  else if (spanYears > 2) stepMonths = 6;
  else if (spanYears > 1) stepMonths = 3;
  else stepMonths = 1;

  const raw: AxisTick[] = [];
  const cursor = new Date(min.getFullYear(), min.getMonth(), 1);
  const end = new Date(max.getFullYear(), max.getMonth() + 1, 1);

  while (cursor <= end) {
    const pct = toPercent(cursor);
    if (pct >= 0 && pct <= 100) {
      const isYearStart = cursor.getMonth() === 0;
      raw.push({
        date: new Date(cursor),
        percent: pct,
        label:
          stepMonths >= 12
            ? String(cursor.getFullYear())
            : isYearStart
              ? String(cursor.getFullYear())
              : MONTHS[cursor.getMonth()],
        isMajor: stepMonths >= 12 || isYearStart,
      });
    }
    cursor.setMonth(cursor.getMonth() + stepMonths);
  }

  // Drop ticks closer than ~8% apart to prevent overlap
  const filtered: AxisTick[] = [];
  for (const tick of raw) {
    const last = filtered[filtered.length - 1];
    if (!last || tick.percent - last.percent >= 8) {
      filtered.push(tick);
    }
  }

  if (filtered.length < 2) {
    return [
      { date: min, percent: 0, label: String(min.getFullYear()), isMajor: true },
      { date: max, percent: 100, label: String(max.getFullYear()), isMajor: true },
    ];
  }

  return filtered;
}

const LicenseTimeline: React.FC<LicenseTimelineProps> = ({ licenses }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { rangeStart, rangeEnd, licenseRows, axisTicks, toPercent } = useMemo(() => {
    const parsedDates = licenses.flatMap((lic) => [parseDate(lic.issue_date), parseDate(lic.expiry_date)]);

    let start: Date;
    let end: Date;

    if (parsedDates.length === 0) {
      start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      end = new Date(today);
      end.setMonth(end.getMonth() + 9);
    } else {
      start = new Date(Math.min(...parsedDates.map((d) => d.getTime())));
      end = new Date(Math.max(...parsedDates.map((d) => d.getTime())));
      start.setDate(start.getDate() - 60);
      end.setDate(end.getDate() + 60);
    }

    if (today.getTime() < start.getTime()) start = new Date(today.getTime() - 60 * MS_PER_DAY);
    if (today.getTime() > end.getTime()) end = new Date(today.getTime() + 60 * MS_PER_DAY);

    const totalMs = Math.max(end.getTime() - start.getTime(), MS_PER_DAY);
    const percentFn = (date: Date) =>
      Math.min(100, Math.max(0, ((date.getTime() - start.getTime()) / totalMs) * 100));

    const rows = licenses.map((lic) => {
      const issue = parseDate(lic.issue_date);
      const expiry = parseDate(lic.expiry_date);
      const left = percentFn(issue);
      const right = percentFn(expiry);

      return {
        license: lic,
        left,
        width: Math.max(right - left, 1.5),
        issuePercent: left,
        expiryPercent: right,
        issueLabel: formatShortDate(issue),
        expiryLabel: formatShortDate(expiry),
      };
    });

    return {
      rangeStart: start,
      rangeEnd: end,
      licenseRows: rows,
      axisTicks: getSmartAxisTicks(start, end, percentFn),
      toPercent: percentFn,
    };
  }, [licenses, today]);

  const todayPercent = toPercent(today);

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold font-norms text-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            License Compliance Timeline
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Each license spans from issue to expiry — aligned on a shared date axis.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg font-semibold text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formatShortDate(rangeStart)} — {formatShortDate(rangeEnd)}
          </div>
          <Link
            to="/udyan/scanner"
            className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add License
          </Link>
        </div>
      </div>

      {licenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-14 px-6 text-center"
        >
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-600">No licenses on the timeline yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Upload your first license to start tracking dates here.</p>
          <Link
            to="/udyan/scanner"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Go to Scanner →
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Timeline canvas */}
          <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50/60 to-white p-4 sm:p-5">
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Today marker — spans full chart */}
                <div className="relative">
                  <motion.div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none"
                    style={{ left: `${todayPercent}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="relative -translate-x-1/2 flex flex-col items-center h-full">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mb-2">
                        Today
                      </span>
                      <div className="w-px flex-1 bg-indigo-400/60 relative">
                        <motion.div
                          className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100"
                          animate={{ boxShadow: ['0 0 0 0 rgba(99,102,241,0.35)', '0 0 0 6px rgba(99,102,241,0)', '0 0 0 0 rgba(99,102,241,0.35)'] }}
                          transition={{ duration: 2.2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* License rows */}
                  <div className="space-y-5 pb-2">
                    <AnimatePresence>
                      {licenseRows.map((row, idx) => {
                        const theme = getStatusTheme(row.license.status);

                        return (
                          <motion.div
                            key={row.license.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 24, delay: idx * 0.1 }}
                            className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-3 items-center"
                          >
                            {/* License name */}
                            <Link
                              to={`/udyan/license/${row.license.type}`}
                              className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all hover:shadow-md ${theme.badge}`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${theme.icon}`}>
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold truncate leading-tight">{row.license.type}</p>
                                <p className="text-[9px] opacity-70 font-semibold">{theme.label}</p>
                              </div>
                            </Link>

                            {/* Track row */}
                            <div className="relative h-14">
                              {/* Background rail */}
                              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-gray-100 rounded-full" />

                              {/* Duration bar */}
                              <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 + idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                                className={`absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full ${theme.bar} ${theme.barGlow}`}
                                style={{
                                  left: `${row.left}%`,
                                  width: `${row.width}%`,
                                  transformOrigin: 'left center',
                                }}
                              />

                              {row.width < 18 ? (
                                /* Compact marker when dates are close together */
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.85 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.35 + idx * 0.12, type: 'spring', stiffness: 300 }}
                                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                                  style={{ left: `${row.left + row.width / 2}%` }}
                                >
                                  <div className={`border rounded-xl px-3 py-1.5 shadow-md text-center ${theme.card}`}>
                                    <p className="text-[9px] font-bold text-gray-800">{row.license.type}</p>
                                    <p className="text-[8px] text-gray-500 font-semibold mt-0.5">
                                      {row.issueLabel} → {row.expiryLabel}
                                    </p>
                                  </div>
                                  <div className={`mx-auto mt-1.5 w-3 h-3 rounded-full border-2 ${theme.dot}`} />
                                </motion.div>
                              ) : (
                                <>
                                  {/* Issue milestone */}
                                  <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.35 + idx * 0.12, type: 'spring', stiffness: 300 }}
                                    className="absolute top-0 -translate-x-1/2 z-10"
                                    style={{ left: `${row.issuePercent}%` }}
                                  >
                                    <div className={`flex flex-col items-center border rounded-lg px-2 py-1 shadow-sm ${theme.card}`}>
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wide text-gray-500">
                                        <FileText className="w-2.5 h-2.5" />
                                        Issued
                                      </div>
                                      <span className="text-[9px] font-bold text-gray-800 whitespace-nowrap mt-0.5">
                                        {row.issueLabel}
                                      </span>
                                    </div>
                                    <div className={`mx-auto mt-1 w-2.5 h-2.5 rounded-full border-2 ${theme.dot}`} />
                                  </motion.div>

                                  {/* Expiry milestone */}
                                  <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.45 + idx * 0.12, type: 'spring', stiffness: 300 }}
                                    className="absolute bottom-0 -translate-x-1/2 z-10"
                                    style={{ left: `${row.expiryPercent}%` }}
                                  >
                                    <div className={`mx-auto mb-1 w-2.5 h-2.5 rounded-full border-2 ${theme.dot}`} />
                                    <div className={`flex flex-col items-center border rounded-lg px-2 py-1 shadow-sm ${theme.card}`}>
                                      <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wide text-gray-500">
                                        <Clock className="w-2.5 h-2.5" />
                                        Expires
                                      </div>
                                      <span className="text-[9px] font-bold text-gray-800 whitespace-nowrap mt-0.5">
                                        {row.expiryLabel}
                                      </span>
                                    </div>
                                  </motion.div>
                                </>
                              )}

                              {/* Arrow hint on bar (center) */}
                              {row.width > 12 && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 0.5 }}
                                  transition={{ delay: 0.7 + idx * 0.1 }}
                                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none text-white"
                                  style={{ left: `${row.left + row.width / 2}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Shared date axis — sparse, readable labels */}
                <div className="relative h-10 mt-4 border-t border-gray-200 pt-3">
                  <div className="absolute inset-x-0 top-3 h-px bg-gray-200" />
                  {axisTicks.map((tick, idx) => (
                    <motion.div
                      key={`${tick.label}-${idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.06 }}
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${tick.percent}%` }}
                    >
                      <div className={`w-px ${tick.isMajor ? 'h-3 bg-gray-400' : 'h-2 bg-gray-300'}`} />
                      <span
                        className={`mt-1.5 whitespace-nowrap ${
                          tick.isMajor
                            ? 'text-[11px] font-bold text-gray-700'
                            : 'text-[10px] font-semibold text-gray-400'
                        }`}
                      >
                        {tick.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {licenseRows.map((row, idx) => {
              const theme = getStatusTheme(row.license.status);
              const totalDays = Math.round(
                (parseDate(row.license.expiry_date).getTime() - parseDate(row.license.issue_date).getTime()) / MS_PER_DAY
              );
              const daysLeft = Math.round(
                (parseDate(row.license.expiry_date).getTime() - today.getTime()) / MS_PER_DAY
              );

              return (
                <motion.div
                  key={`summary-${row.license.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.08 }}
                  className={`rounded-xl border p-3.5 ${theme.card}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800">{row.license.type}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${theme.badge}`}>
                      {theme.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 font-semibold">
                    <span>{row.issueLabel}</span>
                    <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{row.expiryLabel}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                    {totalDays} day validity
                    {daysLeft >= 0 ? ` · ${daysLeft} days remaining` : ` · expired ${Math.abs(daysLeft)} days ago`}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-[10px] font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-emerald-500" /> Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-amber-500" /> Expiring Soon
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-red-500" /> Expired
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-px h-3 bg-indigo-400" /> Today
            </span>
            <span className="ml-auto text-gray-400">
              {licenses.length} license{licenses.length !== 1 ? 's' : ''} tracked
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default LicenseTimeline;
