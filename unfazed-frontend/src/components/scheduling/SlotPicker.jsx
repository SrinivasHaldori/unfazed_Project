import React, { useState } from 'react';
import { Calendar, Clock, Globe, ChevronRight } from 'lucide-react';

export const SlotPicker = ({
  slots = [],
  selectedSlot = null,
  onSelectSlot,
  loading = false,
  selectedTimezone,
  onChangeTimezone,
}) => {
  const timezones = [
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Australia/Sydney',
    'Asia/Singapore',
  ];

  // Group slots by date string
  const groupedSlots = slots.reduce((acc, slot) => {
    const dateObj = new Date(slot.startTime);
    const dateKey = dateObj.toLocaleDateString('en-US', {
      timeZone: selectedTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(groupedSlots);
  const [selectedDate, setSelectedDate] = useState(dates[0] || null);

  const activeDate = selectedDate || dates[0];
  const currentDaySlots = activeDate ? groupedSlots[activeDate] || [] : [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
      {/* Timezone Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Globe className="h-4 w-4 text-brand-400" />
          <span>Times shown in:</span>
        </div>
        <select
          value={selectedTimezone}
          onChange={(e) => onChangeTimezone(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-850 px-3 py-1.5 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz} ({tz === 'Asia/Kolkata' ? 'IST' : tz.split('/')[1]})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading open appointment slots...</div>
      ) : dates.length === 0 ? (
        <div className="py-12 text-center text-slate-400">No open appointment slots found for this period.</div>
      ) : (
        <div>
          {/* Date Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-center transition-all ${
                  activeDate === d
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-400'
                    : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-semibold uppercase">{d.split(',')[0]}</div>
                <div className="text-sm font-bold">{d.split(',')[1]}</div>
              </button>
            ))}
          </div>

          {/* Time Slot Grid */}
          <div className="mt-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Start Time:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentDaySlots.map((slot, idx) => {
                const startTimeFormatted = new Date(slot.startTime).toLocaleTimeString('en-US', {
                  timeZone: selectedTimezone,
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isSelected = selectedSlot?.startTime === slot.startTime;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-brand-400 bg-brand-500/20 text-brand-300 ring-2 ring-brand-500/40'
                        : 'border-slate-800 bg-slate-850 text-slate-200 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-400" />
                      <span>{startTimeFormatted}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
