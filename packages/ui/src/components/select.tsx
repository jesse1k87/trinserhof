import * as React from 'react';
import { createPortal } from 'react-dom';

import { getPortalContainer, useFloatingPosition, useOutsideInteraction } from '../lib/floating';
import { Button } from './Button';

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

const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { open, setOpen, disabled, triggerRef } = useSelectContext();

  return (
    <Button
      ref={(node) => {
        triggerRef.current = node;
      }}
      type="button"
      disabled={disabled}
      className={className ? `select ${className}` : 'select w-full'}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </Button>
  );
};

const SelectValue = ({ placeholder }: { placeholder?: React.ReactNode }) => {
  const { selectedLabel } = useSelectContext();
  return <>{selectedLabel ?? placeholder}</>;
};

const SelectContent = ({ children }: { children?: React.ReactNode }) => {
  const { open, setOpen, triggerRef } = useSelectContext();
  const contentRef = React.useRef<HTMLUListElement | null>(null);
  const position = useFloatingPosition(triggerRef, open, { align: 'start', sideOffset: 4 });

  useOutsideInteraction([triggerRef, contentRef], () => setOpen(false), open);

  if (!open || !position) return null;

  return createPortal(
    <ul
      ref={contentRef}
      className="menu fixed z-50 max-h-96 overflow-auto rounded-box bg-base-100 shadow-md"
      style={{
        top: position.top,
        left: position.left,
        minWidth: position.minWidth,
        transform: position.transform,
      }}
    >
      {children}
    </ul>,
    getPortalContainer(triggerRef.current),
  );
};

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const SelectItem = ({ className, value, children, onClick, ...props }: SelectItemProps) => {
  const { value: selectedValue, setValue, setOpen } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <li>
      <Button
        type="button"
        className={`${isSelected ? 'menu-active' : ''} ${className ?? ''}`.trim() || undefined}
        onClick={(event) => {
          onClick?.(event);
          setValue(value);
          setOpen(false);
        }}
        {...props}
      >
        {children}
      </Button>
    </li>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
