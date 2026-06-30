import * as React from 'react';

import { cn } from '../lib/utils';
import { useFloatingPosition, type Align } from '../lib/floating';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

const usePopoverContext = () => {
  const context = React.useContext(PopoverContext);
  if (!context) throw new Error('Popover components must be used within a <Popover>');
  return context;
};

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Popover = ({ open: openProp, onOpenChange, children }: PopoverProps) => {
  const [openState, setOpenState] = React.useState(false);
  const open = openProp ?? openState;
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const value = React.useMemo(() => ({ open, setOpen, triggerRef }), [open, setOpen]);

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
};

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, onClick, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = usePopoverContext();

    const setRefs = (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node as HTMLButtonElement);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current =
          node as HTMLButtonElement;
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      setOpen(!open);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: setRefs,
        'aria-expanded': open,
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          (children as React.ReactElement<any>).props.onClick?.(event);
          handleClick(event);
        },
      });
    }

    return (
      <button ref={setRefs} type="button" aria-expanded={open} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  },
);
PopoverTrigger.displayName = 'PopoverTrigger';

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align;
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, style, ...props }, ref) => {
    const { open, setOpen, triggerRef } = usePopoverContext();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const position = useFloatingPosition(triggerRef, open, { align, sideOffset });

    // Native popovers render in the browser's top layer, so they stack above an
    // open <dialog> regardless of z-index - a portaled div can't.
    React.useLayoutEffect(() => {
      contentRef.current?.togglePopover(open);
    }, [open]);

    React.useEffect(() => {
      const el = contentRef.current;
      if (!el) return;
      const handleToggle = (event: ToggleEvent) => setOpen(event.newState === 'open');
      el.addEventListener('toggle', handleToggle);
      return () => el.removeEventListener('toggle', handleToggle);
    }, [setOpen]);

    return (
      <div
        ref={(node) => {
          if (node) node.setAttribute('popover', 'auto');
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          'fixed inset-auto z-50 m-0 w-72 rounded-md border border-base-300 bg-base-100 p-4 text-base-content outline-none',
          className,
        )}
        style={{
          top: position?.top ?? 0,
          left: position?.left ?? 0,
          minWidth: position?.minWidth,
          transform: position?.transform,
          ...style,
        }}
        {...props}
      />
    );
  },
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
