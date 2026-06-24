import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

type AccordionType = 'single' | 'multiple';

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext('');

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  collapsible?: boolean;
  defaultValue?: string | string[];
}

const Accordion = ({
  type = 'single',
  collapsible = false,
  defaultValue,
  className,
  children,
  ...props
}: AccordionProps) => {
  const [openValues, setOpenValues] = React.useState<Set<string>>(
    () =>
      new Set(defaultValue ? (Array.isArray(defaultValue) ? defaultValue : [defaultValue]) : []),
  );

  const toggle = React.useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        const isOpen = prev.has(value);
        if (isOpen) {
          if (type === 'single' && !collapsible) return prev;
          const next = new Set(prev);
          next.delete(value);
          return next;
        }
        return type === 'multiple' ? new Set(prev).add(value) : new Set([value]);
      });
    },
    [type, collapsible],
  );

  const isOpen = React.useCallback((value: string) => openValues.has(value), [openValues]);
  const contextValue = React.useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({
  value,
  className,
  children,
  ...props
}: { value: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <AccordionItemContext.Provider value={value}>
    <div className={cn('border-b border-base-300', className)} {...props}>
      {children}
    </div>
  </AccordionItemContext.Provider>
);

const useAccordionItem = () => {
  const ctx = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);
  if (!ctx) throw new Error('Must be used within an Accordion');
  return { open: ctx.isOpen(value), toggle: () => ctx.toggle(value) };
};

const AccordionTrigger = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { open, toggle } = useAccordionItem();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      className={cn(
        'flex w-full flex-1 items-center justify-between py-4 font-medium transition-all hover:underline',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
      />
    </button>
  );
};

const AccordionContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { open } = useAccordionItem();
  if (!open) return null;

  return (
    <div className="overflow-hidden text-sm" {...props}>
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </div>
  );
};

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
