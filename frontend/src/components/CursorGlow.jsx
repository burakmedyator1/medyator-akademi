import { useEffect, useRef } from 'react';
import './CursorGlow.css';

// A soft, brand-colored light that follows the cursor across the whole site.
// Skipped entirely on touch devices (no cursor) and when the user prefers
// reduced motion, since neither can meaningfully perceive it.
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    let frame = null;

    function handleMove(e) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--glow-x', `${e.clientX}px`);
        el.style.setProperty('--glow-y', `${e.clientY}px`);
        el.classList.add('cursor-glow--visible');
        frame = null;
      });
    }

    function handleLeave() {
      el.classList.remove('cursor-glow--visible');
    }

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}
