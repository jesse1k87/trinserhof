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
  React.useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      onOutside();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOutside();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onOutside, refs]);
};
