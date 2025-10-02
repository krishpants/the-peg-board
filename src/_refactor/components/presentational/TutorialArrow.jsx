import React, { useRef, useLayoutEffect, useState, cloneElement } from 'react';
import { createPortal } from 'react-dom';

/** Wrapper component that shows a tutorial arrow next to any element */
export const Tutored = ({ show, side = 'right', direction = 'right', color = '#fbbf24', gap = 8, label, children }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, visible: false });

  const update = () => {
    const el = ref.current;
    if (!el) return setPos(p => ({ ...p, visible: false }));
    const r = el.getBoundingClientRect();

    let top, left, transform;
    if (side === 'right') {
      top = r.top + r.height / 2;
      left = r.right + gap;
      transform = 'translateY(-50%)';
    } else if (side === 'left') {
      top = r.top + r.height / 2;
      left = r.left - gap;
      transform = 'translate(-100%, -50%)';
    } else if (side === 'bottom') {
      top = r.bottom + gap;
      left = r.left + r.width / 2;
      transform = 'translateX(-50%)';
    } else if (side === 'top') {
      top = r.top - gap;
      left = r.left + r.width / 2;
      transform = 'translate(-50%, -100%)';
    }

    setPos({ top, left, transform, visible: true });
  };

  useLayoutEffect(() => {
    if (!show) {
      setPos(p => ({ ...p, visible: false }));
      return;
    }

    // Update immediately
    update();

    // Also update multiple times to catch animations
    const timers = [
      setTimeout(update, 100),
      setTimeout(update, 300),
      setTimeout(update, 600),
      setTimeout(update, 800)
    ];

    const ro = new ResizeObserver(update);
    ref.current && ro.observe(ref.current);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [show]);

  const child = React.Children.only(children);
  const withRef = cloneElement(child, {
    ref: (node) => {
      ref.current = node;
      const cRef = child.ref;
      if (typeof cRef === 'function') cRef(node);
      else if (cRef) cRef.current = node;
    }
  });

  return (
    <>
      {withRef}
      {show && pos.visible && createPortal(
        <div
          className={`tutorial-arrow tutorial-arrow--direction-${direction}`}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: pos.transform,
            pointerEvents: 'none',
            zIndex: 2147483646,
            '--arrow-color': color
          }}
        >
          <svg
            className="tutorial-arrow__svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {direction === 'up' && (
              <path
                d="M 50 80 Q 45 60, 48 40 Q 49 20, 50 10 Q 43 18, 35 38 M 50 10 Q 57 18, 65 38"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {direction === 'down' && (
              <path
                d="M 50 20 Q 45 40, 48 60 Q 49 80, 50 90 Q 43 82, 35 62 M 50 90 Q 57 82, 65 62"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {direction === 'left' && (
              <path
                d="M 80 50 Q 60 45, 40 48 Q 20 49, 10 50 Q 18 43, 38 35 M 10 50 Q 18 57, 38 65"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {direction === 'right' && (
              <path
                d="M 20 50 Q 40 45, 60 48 Q 80 49, 90 50 Q 82 43, 62 35 M 90 50 Q 82 57, 62 65"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          {label && (
            <div
              style={{
                position: 'absolute',
                top: direction === 'left' || direction === 'right' ? '60px' : '0',
                left: direction === 'right' ? '0' : direction === 'left' ? '0' : direction === 'up' || direction === 'down' ? '60px' : '0',
                fontSize: '16px',
                fontWeight: '700',
                fontFamily: 'Comic Sans MS, Marker Felt, cursive',
                color: color,
                whiteSpace: 'nowrap',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                transform: 'rotate(-2deg)',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              {label}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tutored;
