'use client';

import { useState, useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/api';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICONS: Record<string, string> = {
  Appointment: 'calendar_month',
  Report:      'description',
  System:      'notifications',
};

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService.getUserNotifications()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const unread = items.filter((n) => !n.isRead);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className="absolute top-full end-0 mt-2 w-80 bg-surface-container-lowest rounded-xl ambient-shadow ghost-border overflow-hidden z-50 animate-fade-in-up"
    >
      <div className="px-5 py-4 border-b border-surface-container-high flex justify-between items-center">
        <div>
          <h3 className="font-bold text-on-surface text-sm">Notifications</h3>
          {unread.length > 0 && (
            <p className="text-xs text-on-surface-variant">{unread.length} unread</p>
          )}
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto divide-y divide-surface-container-high">
        {loading ? (
          <div className="p-6 text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">notifications_off</span>
            <p className="text-sm text-on-surface-variant mt-2">No notifications</p>
          </div>
        ) : (
          items.map((notif) => (
            <div
              key={notif.id}
              className={`flex gap-3 px-5 py-4 hover:bg-surface-container-low transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.isRead ? 'bg-primary/10' : 'bg-surface-container-high'}`}>
                <span className={`material-symbols-outlined text-sm ${!notif.isRead ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {TYPE_ICONS[notif.type] ?? 'notifications'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-xs font-bold text-on-surface leading-tight">{notif.title}</p>
                  {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-0.5" />}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">{relativeTime(notif.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
