import React from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const Counter = ({
  value,              // final number to reach
  duration = 1200,    // ms
  start = 1,          // start at 1 as you requested
}) => {
  const [display, setDisplay] = React.useState(start);
  const prevRef = React.useRef(start);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    const end = Number(value) || 0;
    const from = Math.max(1, prevRef.current);   // ensure start is >= 1
    if (from === end || duration <= 0) {
      prevRef.current = end;
      setDisplay(end);
      return;
    }

    const startTime = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const current = from + (end - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = end;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span>{Math.round(display).toLocaleString()}</span>;
};