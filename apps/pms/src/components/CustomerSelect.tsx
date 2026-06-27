import * as React from 'react';
import { Customer, User } from '@trinserhof/types';
import { getNewCustomer, isValidEmailAddress } from '@trinserhof/helpers';
import { logAuditEvent, saveCustomer } from '@trinserhof/database';
import { toast } from 'sonner';
import { Button } from '@trinserhof/ui/src/components/button';
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
import {
  ChevronsUpDown as CaretSortIcon,
  Check as CheckIcon,
  Plus as PlusIcon,
} from 'lucide-react';

const getCustomerSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `This customer could not be saved: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This customer is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the customer.';
};

const customerLabel = (customer: Customer) =>
  [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email;

// A searchable customer picker with an inline "create new customer" flow. It powers both
// single-select use (pick one customer; the popover closes after a choice) and multi-select
// use: pass `linkedIds` and selected entries show a check and the popover stays open so several
// can be toggled in a row. `onSelect` fires both for an existing customer and for a freshly
// created one, so callers handle linking in one place.
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

  const multiSelect = linkedIds !== undefined;

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
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={!enabled}
          className="justify-between hover:cursor-pointer"
        >
          {triggerLabel}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {draft ? (
          <div className="flex flex-col gap-2 p-3">
            <div className="text-xs text-muted-foreground">New customer</div>
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
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Back
              </Button>
              <Button
                size="sm"
                disabled={
                  saving ||
                  !draft.name.trim() ||
                  Boolean(draft.email && !isValidEmailAddress(draft.email))
                }
                onClick={handleCreate}
              >
                Create &amp; link
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Command>
              <CommandInput
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
                        {customerLabel(c)}
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                      {linkedIds && (
                        <CheckIcon
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
              <button
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:cursor-pointer"
                onClick={() => {
                  const trimmed = search.trim();
                  setDraft({
                    ...getNewCustomer(),
                    ...(trimmed.includes('@') ? { email: trimmed } : { name: trimmed }),
                  });
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create new customer
                {search.trim() && ` "${search.trim()}"`}
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
