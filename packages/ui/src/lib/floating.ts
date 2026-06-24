import * as React from 'react';

export type Align = 'start' | 'center' | 'end';

interface FloatingPosition {
  top: number;
  left: number;
  minWidth: number;
  transform: string;
}

export const useFloatingPosition = (
  anchorRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  { align = 'start', sideOffset = 4 }: { align?: Align; sideOffset?: number } = {},
) => {
  const [position, setPosition] = React.useState<FloatingPosition | null>(null);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const left =
        align === 'end' ? rect.right : align === 'center' ? rect.left + rect.width / 2 : rect.left;
      const transform =
        align === 'end' ? 'translateX(-100%)' : align === 'center' ? 'translateX(-50%)' : 'none';
      setPosition({
        top: Math.round(rect.bottom + sideOffset),
        left: Math.round(left),
        minWidth: rect.width,
        transform,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, align, sideOffset, anchorRef]);

  return position;
};

export const getPortalContainer = (anchor: HTMLElement | null): HTMLElement =>
  anchor?.closest('dialog') ?? document.body;

export const useOutsideInteraction = (
  refs: Array<React.RefObject<HTMLElement | null>>,
  onOutside: () => void,
  enabled: boolean,
) => {
  // refs/onOutside are passed as fresh array/function literals on every
  // render. Routing them through a ref keeps the effect below from tearing
  // down and re-adding the document listeners on every render the dropdown
  // is open for (it should only do that when `enabled` actually changes).
  const latest = React.useRef({ refs, onOutside });
  latest.current = { refs, onOutside };

  React.useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (latest.current.refs.some((ref) => ref.current?.contains(target))) return;
      latest.current.onOutside();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') latest.current.onOutside();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
};
