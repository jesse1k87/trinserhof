import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '../../lib/utils';

interface SheetContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

interface SheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => (
  <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>
);

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-base-100 p-6 text-base-content shadow-lg backdrop:bg-black/10',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 m-0 w-full border-b border-base-300',
        bottom: 'inset-x-0 bottom-0 m-0 w-full border-t border-base-300',
        left: 'inset-y-0 left-0 m-0 h-full w-3/4 border-r border-base-300 sm:max-w-sm',
        right: 'inset-y-0 right-0 m-0 h-full w-3/4 border-l border-base-300 sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDialogElement>, VariantProps<typeof sheetVariants> {
  onOpenAutoFocus?: (event: Event) => void;
}

const SheetContent = React.forwardRef<HTMLDialogElement, SheetContentProps>(
  ({ side = 'right', className, children, onOpenAutoFocus, ...props }, forwardedRef) => {
    const context = React.useContext(SheetContext);
    if (!context) throw new Error('SheetContent must be used within a <Sheet>');
    const { open, onOpenChange } = context;
    const dialogRef = React.useRef<HTMLDialogElement | null>(null);

    const setRefs = (node: HTMLDialogElement | null) => {
      dialogRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef)
        (forwardedRef as React.MutableRefObject<HTMLDialogElement | null>).current = node;
    };

    React.useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog || !dialog.open) dialog?.showModal();
    }, []);

    React.useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const handleCancel = (event: Event) => {
        event.preventDefault();
        onOpenChange?.(false);
      };
      const handleClose = () => onOpenChange?.(false);

      dialog.addEventListener('cancel', handleCancel);
      dialog.addEventListener('close', handleClose);
      return () => {
        dialog.removeEventListener('cancel', handleCancel);
        dialog.removeEventListener('close', handleClose);
      };
    }, [onOpenChange]);

    if (!open) return null;

    return (
      <dialog
        ref={setRefs}
        className={cn(sheetVariants({ side }), className)}
        onClick={(event) => {
          if (event.target === dialogRef.current) onOpenChange?.(false);
        }}
        {...props}
      >
        {children}
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </dialog>
    );
  },
);
SheetContent.displayName = 'SheetContent';

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
  ),
);
SheetTitle.displayName = 'SheetTitle';

export { Sheet, SheetContent, SheetTitle };
