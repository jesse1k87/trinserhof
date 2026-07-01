import * as React from 'react';
import { Customer, User } from '@trinserhof/types';
import { getNewCustomer, isValidEmailAddress } from '@trinserhof/helpers';
import { logAuditEvent, saveCustomer } from '@trinserhof/supabase';
import { toast } from 'sonner';
import { AddIcon, Button, CheckIcon, SmallText } from '@trinserhof/ui';
import { Input } from '@trinserhof/ui/src/components/input';
import { SearchableSelect } from './SearchableSelect';

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
  const [draft, setDraft] = React.useState<Customer | null>(null);
  const [saving, setSaving] = React.useState(false);

  const multiSelect = linkedIds !== undefined;

  const handleCreate = async (close: () => void) => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await saveCustomer(draft);
      logAuditEvent('CUSTOMER_CREATED', user.email);
      onSelect(saved);
      // Closing resets the draft (via onOpenChange) and the search text.
      close();
    } catch (error) {
      toast.error(getCustomerSaveErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SearchableSelect
      items={customers}
      triggerLabel={triggerLabel}
      enabled={enabled}
      onSelect={onSelect}
      // Single-select replaces the choice and closes; multi-select keeps the
      // popover open so several customers can be toggled before dismissing it.
      closeOnSelect={!multiSelect}
      onOpenChange={(open) => {
        if (!open) setDraft(null);
      }}
      getItemKey={(customer) => customer.id}
      getItemKeywords={(customer) => [
        customer.name,
        customer.surname ?? '',
        customer.email ?? '',
        customer.phone ?? '',
      ]}
      searchPlaceholder="Search customers…"
      emptyLabel="No customers found."
      renderItem={(customer) => (
        <>
          <div>
            {[customer.name, customer.surname].filter(Boolean).join(' ') || customer.email}
            <SmallText>
              {[customer.email, customer.phone, customer.city, customer.country]
                .filter(Boolean)
                .join(', ')}
            </SmallText>
          </div>
          {linkedIds && (
            <CheckIcon
              className={`ml-auto h-4 w-4 ${
                linkedIds.includes(customer.id) ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </>
      )}
      footer={({ search }) => (
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
            <AddIcon className="mr-2 h-4 w-4" />
            Create new customer
            {search.trim() && ` "${search.trim()}"`}
          </Button>
        </div>
      )}
      renderOverride={({ close }) =>
        draft ? (
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
                onClick={() => handleCreate(close)}
              >
                Create
              </Button>
            </div>
          </div>
        ) : null
      }
    />
  );
};
