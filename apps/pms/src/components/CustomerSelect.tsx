import * as React from 'react';
import { Customer, User } from '@trinserhof/types';
import { getNewCustomer, isValidEmailAddress } from '@trinserhof/helpers';
import { logAuditEvent, saveCustomer } from '@trinserhof/supabase';
import { toast } from 'sonner';
import { Button } from '@trinserhof/ui';
import { Input } from '@trinserhof/ui/src/components/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui/src/components/popover';
import { ICONS } from '@trinserhof/ui';
import { SmallText } from '@trinserhof/ui';

const getCustomerSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `This customer could not be saved: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This customer is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the customer.';
};

export const CustomerSelect = ({
  customers,
  triggerLabel,
  onSelect,
  user,
  enabled,
  linkedIds,
}: {
  customers: Customer[];
  triggerLabel: string;
  onSelect: (customer: Customer) => void;
  user: User;
  enabled: boolean;
  linkedIds?: string[];
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [draft, setDraft] = React.useState<Customer | null>(null);
  const [saving, setSaving] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const multiSelect = linkedIds !== undefined;

  // The popover content stays mounted across opens (native popover toggle, not
  // conditional render), so `autoFocus` on the input only fires once - focus it
  // manually every time the popover opens instead.
  React.useEffect(() => {
    if (open && !draft) searchInputRef.current?.focus();
  }, [open, draft]);

  const reset = () => {
    setDraft(null);
    setSearch('');
  };

  const handleSelectExisting = (customer: Customer) => {
    onSelect(customer);
    // Single-select replaces the choice and closes; multi-select keeps the popover open
    // so several customers can be toggled before dismissing it.
    if (!multiSelect) setOpen(false);
  };

  const handleCreate = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await saveCustomer(draft);
      logAuditEvent('CUSTOMER_CREATED', user.email);
      onSelect(saved);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getCustomerSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          disabled={!enabled}
          className="justify-between hover:cursor-pointer"
        >
          {triggerLabel}
          <ICONS.sort className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {draft ? (
          <div className="flex flex-col gap-2 p-3">
            <SmallText>New customer</SmallText>
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
            <Input
              placeholder="Surname (optional)"
              value={draft.surname ?? ''}
              onChange={(event) => setDraft({ ...draft, surname: event.target.value })}
            />
            <Input
              placeholder="E-mail (optional)"
              value={draft.email ?? ''}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
            <Input
              placeholder="Phone (optional)"
              value={draft.phone ?? ''}
              onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
            />
            <div className="flex flex-row justify-end gap-2 pt-1">
              <Button onClick={() => setDraft(null)}>Back</Button>
              <Button
                disabled={
                  saving ||
                  !draft.name.trim() ||
                  Boolean(draft.email && !isValidEmailAddress(draft.email))
                }
                onClick={handleCreate}
              >
                Create
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Command>
              <CommandInput
                ref={searchInputRef}
                placeholder="Search customers…"
                className="h-9"
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No customers found.</CommandEmpty>
                <CommandGroup>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      keywords={[c.name, c.surname ?? '', c.email ?? '', c.phone ?? '']}
                      onSelect={() => handleSelectExisting(c)}
                    >
                      <div>
                        {[c.name, c.surname].filter(Boolean).join(' ') || c.email}
                        <SmallText>
                          {[c.email, c.phone, c.city, c.country].filter(Boolean).join(', ')}
                        </SmallText>
                      </div>
                      {linkedIds && (
                        <ICONS.check
                          className={`ml-auto h-4 w-4 ${
                            linkedIds.includes(c.id) ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            <div className="border-t p-1">
              <Button
                type="button"
                className="flex w-full items-center p-3 pr-8 text-left text-sm outline-none hover:bg-base-200 hover:cursor-pointer focus:bg-base-200 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => {
                  const trimmed = search.trim();
                  setDraft({
                    ...getNewCustomer(),
                    ...(trimmed.includes('@') ? { email: trimmed } : { name: trimmed }),
                  });
                }}
              >
                <ICONS.add className="mr-2 h-4 w-4" />
                Create new customer
                {search.trim() && ` "${search.trim()}"`}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
