import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/utils';
import {
  getPortalContainer,
  useFloatingPosition,
  useOutsideInteraction,
  type Align,
} from '../lib/floating';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

const useDropdownMenuContext = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenu components must be used within a <DropdownMenu>');
  return context;
};

const DropdownMenu = ({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const value = React.useMemo(() => ({ open, setOpen, triggerRef }), [open]);

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
};

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, onClick, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef } = useDropdownMenuContext();

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
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: Align;
  sideOffset?: number;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'start', sideOffset = 4, style, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useDropdownMenuContext();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const position = useFloatingPosition(triggerRef, open, { align, sideOffset });

    useOutsideInteraction([triggerRef, contentRef], () => setOpen(false), open);

    if (!open || !position) return null;

    return createPortal(
      <div
        ref={(node) => {
          contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border border-base-300 bg-popover p-1 text-popover-foreground shadow-md',
          className,
        )}
        style={{
          top: position.top,
          left: position.left,
          minWidth: position.minWidth,
          transform: position.transform,
          ...style,
        }}
        {...props}
      />,
      getPortalContainer(triggerRef.current),
    );
  },
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDropdownMenuContext();

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-base-200 focus:bg-base-200 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1.5 text-sm font-semibold', className)} {...props} />
  ),
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('-mx-1 my-1 h-px bg-base-300', className)} {...props} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
