/**
 * PostScheduler Component
 * Quick schedule / reschedule panel for social media posts
 */

import { useState } from 'react';
import { Clock, Calendar, Loader2, CheckCircle } from 'lucide-react';

interface PostSchedulerProps {
  postId: string;
  currentDate?: Date;
  onSchedule: (postId: string, date: Date) => Promise<void>;
  onClose: () => void;
}

const QUICK_SLOTS = [
  { label: 'Tomorrow 9 AM', getDate: () => getNextDate(9) },
  { label: 'Tomorrow 12 PM', getDate: () => getNextDate(12) },
  { label: 'Tomorrow 6 PM', getDate: () => getNextDate(18) },
  { label: 'Next Monday 9 AM', getDate: () => getNextMonday(9) },
];

function getNextDate(hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function getNextMonday(hour: number): Date {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function PostScheduler({ postId, currentDate, onSchedule, onClose }: PostSchedulerProps) {
  const [customDate, setCustomDate] = useState(
    currentDate
      ? new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSchedule = async (date: Date) => {
    if (date <= new Date()) return;
    setLoading(true);
    try {
      await onSchedule(postId, date);
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      // error handled upstream
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-900">Post scheduled!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 min-w-[280px]">
      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Clock className="h-4 w-4" /> Schedule Post
      </h4>

      {/* Quick slots */}
      <div className="space-y-1">
        {QUICK_SLOTS.map((slot) => {
          const date = slot.getDate();
          return (
            <button
              key={slot.label}
              onClick={() => handleSchedule(date)}
              disabled={loading}
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <span className="text-gray-700">{slot.label}</span>
              <span className="text-xs text-gray-400">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Custom date & time</label>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            onClick={() => customDate && handleSchedule(new Date(customDate))}
            disabled={!customDate || loading}
            className="flex items-center gap-1 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostScheduler;
