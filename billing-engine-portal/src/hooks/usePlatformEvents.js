import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_EVENTS = 50;

/**
 * Subscribes to platform_events via Supabase Realtime.
 * Returns live events as they arrive from WS1 — zero polling.
 *
 * Falls back to empty array if Supabase is not configured.
 */
export function usePlatformEvents({ limit = 20 } = {}) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!supabase) return;

    // Fetch recent events on mount
    supabase
      .from('platform_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (data?.length) setEvents(data);
      });

    // Subscribe to new inserts
    channelRef.current = supabase
      .channel('platform_events_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'platform_events' },
        (payload) => {
          setEvents((prev) => {
            const next = [payload.new, ...prev];
            return next.slice(0, MAX_EVENTS);
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [limit]);

  return { events, connected };
}
