import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const SLOT_ID = 'gameplay-hud-slot';

/**
 * Renders gameplay HUD rows into the app header slot.
 * Sets `html[data-gameplay-hud]` so `--layout-under-header-h` matches the active stack (CSS-only offsets).
 * @param {{ children: import('react').ReactNode; mode?: 'quiz' | 'review' }} props
 */
export default function GameplayHudPortal({ children, mode = 'quiz' }) {
  const active = children != null && children !== false;

  useEffect(() => {
    const root = document.documentElement;
    if (!active) {
      root.removeAttribute('data-gameplay-hud');
      return undefined;
    }
    root.setAttribute('data-gameplay-hud', mode);
    return () => root.removeAttribute('data-gameplay-hud');
  }, [active, mode]);

  if (typeof document === 'undefined') return null;
  const node = document.getElementById(SLOT_ID);
  if (!node || !active) return null;
  return createPortal(children, node);
}
