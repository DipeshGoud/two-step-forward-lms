'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { adminStore } from '@/lib/data/adminStore';

/**
 * Branded loading animation: the TwoStep Forward logo icon gently pulses
 * inside orbiting brand-colored rings, with a labeled status line below.
 */
export function LogoLoader({
  label = 'Working',
  size = 'md',
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dimensions = {
    sm: { icon: 28, ring: 'w-11 h-11', ringInset: 'inset-0' },
    md: { icon: 40, ring: 'w-16 h-16', ringInset: 'inset-0' },
    lg: { icon: 56, ring: 'w-24 h-24', ringInset: 'inset-0' },
  }[size];

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className={`relative ${dimensions.ring} flex items-center justify-center`}>
        {/* Outer slow orbit */}
        <span
          className={`logo-loader-ring-slow absolute ${dimensions.ringInset} rounded-full border-2 border-transparent border-t-slate-300 border-r-slate-200`}
        />
        {/* Inner fast brand orbit */}
        <span
          className={`logo-loader-ring absolute inset-[5px] rounded-full border-2 border-transparent border-t-[var(--brand-primary)] border-r-[var(--brand-primary)]`}
        />
        {/* Pulsing logo icon */}
        <Image
          src="/logo-icon.png"
          alt=""
          width={dimensions.icon}
          height={dimensions.icon}
          className="logo-loader-icon object-contain relative"
        />
      </div>

      <div className="flex items-center gap-0.5 text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span className="inline-flex gap-0.5 ml-0.5">
          <span className="logo-loader-dot" style={{ animationDelay: '0ms' }}>.</span>
          <span className="logo-loader-dot" style={{ animationDelay: '150ms' }}>.</span>
          <span className="logo-loader-dot" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Full-screen branded overlay shown while heavy LMS mutations (create / save /
 * delete operations) are in flight. Driven by events dispatched from
 * `mutate()` in the admin store so every admin action gets consistent
 * feedback without wiring loaders into each component.
 *
 * Quick requests (<150ms) never flash the overlay; once visible it stays for
 * at least 600ms so it reads as an intentional animation instead of a blink.
 */
const MIN_VISIBLE_MS = 600;
const SHOW_DELAY_MS = 150;

export function GlobalMutationLoader() {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('Working');

  const inFlightCount = useRef(0);
  const lastLabel = useRef('Working');
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minVisibleUntil = useRef(0);

  useEffect(() => {
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<{ label?: string }>).detail;
      inFlightCount.current += 1;
      if (detail?.label) {
        lastLabel.current = detail.label;
      }
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      if (visible || showTimer.current) return;
      showTimer.current = setTimeout(() => {
        showTimer.current = null;
        setLabel(lastLabel.current);
        minVisibleUntil.current = Date.now() + MIN_VISIBLE_MS;
        setVisible(true);
      }, SHOW_DELAY_MS);
    };

    const onEnd = () => {
      inFlightCount.current = Math.max(0, inFlightCount.current - 1);
      if (inFlightCount.current > 0) return;
      if (showTimer.current) {
        clearTimeout(showTimer.current);
        showTimer.current = null;
        return;
      }
      if (!visible) return;
      const remaining = Math.max(0, minVisibleUntil.current - Date.now());
      hideTimer.current = setTimeout(() => {
        hideTimer.current = null;
        setVisible(false);
      }, remaining);
    };

    window.addEventListener('lms-mutation-start', onStart);
    window.addEventListener('lms-mutation-end', onEnd);
    return () => {
      window.removeEventListener('lms-mutation-start', onStart);
      window.removeEventListener('lms-mutation-end', onEnd);
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="logo-loader-overlay fixed inset-0 z-[70] flex items-center justify-center bg-white/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="logo-loader-panel bg-white/95 border border-slate-200/80 shadow-[0_16px_48px_rgba(15,23,42,0.12)] rounded-2xl px-10 py-8">
        <LogoLoader label={label} size="md" />
      </div>
    </div>
  );
}

/**
 * Gate that holds the page behind a branded loader until the LMS store has
 * finished its initial data load. Kicks off the refresh itself so it works on
 * any page, including ones that do not call `useAdminStore()`.
 */
export function StoreHydrationGate({ children }: { children: React.ReactNode }) {
  const isReady = useSyncExternalStore(
    adminStore.subscribe,
    adminStore.getReadySnapshot,
    () => false
  );

  useEffect(() => {
    void adminStore.refresh();
  }, []);

  if (!isReady) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-[#F8FAFC]"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <LogoLoader label="Loading" size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
