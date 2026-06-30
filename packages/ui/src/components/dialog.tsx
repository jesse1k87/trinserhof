import * as React from 'react';
import { ICONS } from '../icons';

const X = ICONS.close;

import { cn } from '../lib/utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
);

const DialogContent = React.forwardRef<HTMLDialogElement, React.HTMLAttributes<HTMLDialogElement>>(
  ({ className, children, ...props }, forwardedRef) => {
    const context = React.useContext(DialogContext);
    if (!context) throw new Error('DialogContent must be used within a <Dialog>');
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
        className={cn(
          'fixed left-1/2 top-1/2 z-50 m-0 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-base-300 bg-base-100 p-6 text-base-content backdrop:bg-neutral/80',
          className,
        )}
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
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
