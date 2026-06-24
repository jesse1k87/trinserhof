import * as React from 'react';
import { createPortal } from 'react-dom';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';

import { cn } from '../../lib/utils';
import { useFloatingPosition, useOutsideInteraction } from '../../lib/floating';

interface SelectContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  selectedLabel: React.ReactNode;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('Select components must be used within a <Select>');
  return context;
};

const findSelectedLabel = (
  children: React.ReactNode,
  value: string | undefined,
): React.ReactNode => {
  if (value === undefined) return undefined;
  let found: React.ReactNode;
  React.Children.forEach(children, (child) => {
    if (found !== undefined) return;
    if (!React.isValidElement(child)) return;
    const props = child.props as { value?: string; children?: React.ReactNode };
    if (child.type === SelectItem && props.value === value) {
      found = props.children;
      return;
    }
    if (props.children) {
      found = findSelectedLabel(props.children, value);
    }
  });
  return found;
};

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  disabled?: boolean;
  children?: React.ReactNode;
}

const Select = ({
  value: valueProp,
  defaultValue,
  onValueChange,
  disabled,
  children,
}: SelectProps) => {
  const [valueState, setValueState] = React.useState(defaultValue);
  const value = valueProp ?? valueState;
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setValue = React.useCallback(
    (next: string) => {
      setValueState(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  const selectedLabel = React.useMemo(() => findSelectedLabel(children, value), [children, value]);

  const contextValue = React.useMemo(
    () => ({ value, setValue, open, setOpen, disabled, triggerRef, selectedLabel }),
    [value, setValue, open, disabled, selectedLabel],
  );

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>;
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, forwardedRef) => {
  const { open, setOpen, disabled, triggerRef } = useSelectContext();

  const setRefs = (node: HTMLButtonElement | null) => {
    triggerRef.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef)
      (forwardedRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  return (
    <button
      ref={setRefs}
      type="button"
      disabled={disabled}
      className={cn(
        'select flex w-full items-center justify-between whitespace-nowrap text-sm hover:cursor-pointer disabled:cursor-not-allowed',
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <CaretSortIcon className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = () => {
  const { selectedLabel } = useSelectContext();
  return <>{selectedLabel}</>;
};

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useSelectContext();
    const contentRef = React.useRef<HTMLDivElement | null>(null);
    const position = useFloatingPosition(triggerRef, open, { align: 'start', sideOffset: 4 });

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
          'fixed z-50 max-h-96 overflow-auto rounded-md border border-base-300 bg-popover p-1 text-popover-foreground shadow-md',
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
      document.body,
    );
  },
);
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, value, children, onClick, ...props }, ref) => {
    const { value: selectedValue, setValue, setOpen } = useSelectContext();
    const isSelected = selectedValue === value;

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-left text-sm outline-none hover:bg-base-200 focus:bg-base-200 disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          setValue(value);
          setOpen(false);
        }}
        {...props}
      >
        {isSelected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <CheckIcon className="h-4 w-4" />
          </span>
        )}
        {children}
      </button>
    );
  },
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
