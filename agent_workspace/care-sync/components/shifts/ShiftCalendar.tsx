'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Calendar,
  Plus,
  X,
  Clock,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
  parseISO,
  set,
} from 'date-fns';

interface Shift {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  shift_type: string;
  assigned_to_user_id: string | null;
  created_by_user_id: string | null;
}

interface Member {
  profile_id: string;
  profiles: { full_name: string | null };
}

interface Props {
  familyId: string;
  members: Member[];
}

const SHIFT_TYPES = [
  { value: 'general', label: 'General', color: 'bg-[var(--sage-200)] border-[var(--sage-400)] text-[var(--sage-800)]' },
  { value: 'medical', label: 'Medical', color: 'bg-[var(--blush-200)] border-[var(--blush-400)] text-[var(--blush-800)]' },
  { value: 'social', label: 'Social', color: 'bg-[var(--lav-200)] border-[var(--lav-400)] text-[var(--lav-800)]' },
  { value: 'rest', label: 'Rest', color: 'bg-[var(--clay-200)] border-[var(--clay-400)] text-[var(--clay-700)]' },
  { value: 'admin', label: 'Admin', color: 'bg-amber-100 border-amber-300 text-amber-800' },
];

const SHIFT_COLOR_MAP: Record<string, string> = Object.fromEntries(
  SHIFT_TYPES.map((t) => [t.value, t.color])
);

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM - 9 PM

export default function ShiftCalendar({ familyId, members }: Props) {
  const supabase = createClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('general');
  const [formAssignee, setFormAssignee] = useState('');
  const [formStartHour, setFormStartHour] = useState('9');
  const [formEndHour, setFormEndHour] = useState('12');
  const [formDescription, setFormDescription] = useState('');

  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ─── Fetch shifts for the week ──────────────────────
  useEffect(() => {
    setLoading(true);
    supabase
      .from('shifts')
      .select('*')
      .eq('family_id', familyId)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', weekEnd.toISOString())
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        setShifts((data as Shift[]) || []);
        setLoading(false);
      });
  }, [weekStart, familyId]);

  // ─── Realtime subscription ──────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`shifts-${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts', filter: `family_id=eq.${familyId}` },
        () => {
          // Refetch on any change
          supabase
            .from('shifts')
            .select('*')
            .eq('family_id', familyId)
            .gte('start_time', weekStart.toISOString())
            .lt('start_time', weekEnd.toISOString())
            .order('start_time', { ascending: true })
            .then(({ data }) => setShifts((data as Shift[]) || []));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [weekStart, familyId]);

  // ─── Open form for a specific day ──────────────────────
  const openForm = (date: Date) => {
    setSelectedDate(date);
    setFormTitle('');
    setFormType('general');
    setFormAssignee('');
    setFormStartHour('9');
    setFormEndHour('12');
    setFormDescription('');
    setShowForm(true);
  };

  // ─── Create shift ──────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formTitle.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const startTime = set(selectedDate, { hours: parseInt(formStartHour), minutes: 0, seconds: 0 });
    const endTime = set(selectedDate, { hours: parseInt(formEndHour), minutes: 0, seconds: 0 });

    await supabase.from('shifts').insert({
      family_id: familyId,
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      shift_type: formType,
      assigned_to_user_id: formAssignee || null,
      created_by_user_id: user?.id || null,
    });

    setSaving(false);
    setShowForm(false);
  };

  // ─── Delete shift ──────────────────────
  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from('shifts').delete().eq('id', id);
    setDeleting(null);
  };

  // ─── Group shifts by day ──────────────────────
  const shiftsByDay = (date: Date) =>
    shifts.filter((s) => isSameDay(parseISO(s.start_time), date));

  const getMemberName = (id: string | null) => {
    if (!id) return null;
    const m = members.find((m) => m.profile_id === id);
    return m?.profiles?.full_name || null;
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(subWeeks(weekStart, 1))}
          className="p-2 text-[var(--clay-400)] hover:text-[var(--clay-600)] hover:bg-[var(--clay-100)] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-[var(--clay-800)]">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h3>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="text-xs text-[var(--sage-600)] hover:text-[var(--sage-700)]"
          >
            Today
          </button>
        </div>
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          className="p-2 text-[var(--clay-400)] hover:text-[var(--clay-600)] hover:bg-[var(--clay-100)] rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day columns */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--sage-500)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-1.5">
          {days.map((day) => {
            const dayShifts = shiftsByDay(day);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] md:min-h-[140px] rounded-xl border p-2 transition-colors ${today
                  ? 'border-[var(--sage-400)] bg-[var(--sage-50)]'
                  : 'border-[var(--clay-200)] bg-white dark:bg-[var(--clay-100)] hover:border-[var(--clay-300)]'
                  }`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--clay-400)] font-medium">
                      {format(day, 'EEE')}
                    </span>
                    <div
                      className={`text-lg font-semibold leading-tight ${today ? 'text-[var(--sage-700)]' : 'text-[var(--clay-800)]'
                        }`}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                  <button
                    onClick={() => openForm(day)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--clay-400)] hover:text-[var(--sage-600)] hover:bg-[var(--sage-100)] transition-colors"
                    title="Add shift"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Shifts for this day */}
                <div className="space-y-1">
                  {dayShifts.map((s) => (
                    <div
                      key={s.id}
                      className={`group relative p-1.5 rounded-md border text-[10px] leading-tight ${SHIFT_COLOR_MAP[s.shift_type] || SHIFT_COLOR_MAP.general
                        }`}
                    >
                      <div className="font-semibold truncate pr-4">{s.title}</div>
                      <div className="opacity-70">
                        {format(parseISO(s.start_time), 'h a')} – {format(parseISO(s.end_time), 'h a')}
                      </div>
                      {getMemberName(s.assigned_to_user_id) && (
                        <div className="flex items-center gap-0.5 opacity-60 mt-0.5">
                          <User className="w-2.5 h-2.5" />
                          <span className="truncate">{getMemberName(s.assigned_to_user_id)}</span>
                        </div>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded bg-white/80 dark:bg-[var(--clay-200)]/80 text-red-500 hover:text-red-700 transition-all"
                      >
                        {deleting === s.id ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )
      }

      {/* Create Shift Modal */}
      {
        showForm && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="card-warm p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--clay-900)]">
                  New Shift — {format(selectedDate, 'EEE, MMM d')}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 text-[var(--clay-400)] hover:text-[var(--clay-600)] rounded-lg hover:bg-[var(--clay-100)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3">
                {/* Title */}
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Shift title (e.g., Morning checkup)"
                  required
                  className="w-full px-3 py-2 border border-[var(--clay-200)] rounded-xl text-sm bg-white dark:bg-[var(--clay-50)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] placeholder:text-[var(--clay-300)]"
                />

                {/* Type chips */}
                <div className="flex flex-wrap gap-1.5">
                  {SHIFT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormType(t.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${formType === t.value
                        ? t.color + ' ring-2 ring-offset-1 ring-[var(--sage-400)]'
                        : 'bg-white dark:bg-[var(--clay-50)] border-[var(--clay-200)] text-[var(--clay-500)] hover:border-[var(--clay-300)]'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Time row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">Start</label>
                    <select
                      value={formStartHour}
                      onChange={(e) => setFormStartHour(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--clay-200)] rounded-xl text-sm bg-white dark:bg-[var(--clay-50)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)]"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {format(set(new Date(), { hours: h, minutes: 0 }), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">End</label>
                    <select
                      value={formEndHour}
                      onChange={(e) => setFormEndHour(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--clay-200)] rounded-xl text-sm bg-white dark:bg-[var(--clay-50)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)]"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {format(set(new Date(), { hours: h, minutes: 0 }), 'h:mm a')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assign to */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--clay-500)] uppercase tracking-wide">Assign to</label>
                  <select
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--clay-200)] rounded-xl text-sm bg-white dark:bg-[var(--clay-50)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)]"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.profile_id} value={m.profile_id}>
                        {m.profiles?.full_name || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-[var(--clay-200)] rounded-xl text-sm bg-white dark:bg-[var(--clay-50)] focus:outline-none focus:ring-2 focus:ring-[var(--sage-300)] placeholder:text-[var(--clay-300)] resize-none"
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-[var(--sage-600)] text-white rounded-xl font-medium text-sm hover:bg-[var(--sage-700)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  Create Shift
                </button>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
