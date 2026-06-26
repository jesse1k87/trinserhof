import * as React from 'react';
import { Badge, Button, PageHeader } from '@trinserhof/ui';
import { type Customer, type User } from '@trinserhof/types';
import {
  type DuplicateCustomerSuggestion,
  type DuplicateMatchReason,
  type NameSplitSuggestion,
  findDuplicateCustomers,
  findNameSplitSuggestions,
} from '@trinserhof/helpers';
import {
  Merge as MergeIcon,
  SplitSquareHorizontal as SplitIcon,
  User as PersonIcon,
  X as XIcon,
} from 'lucide-react';
import useCustomers from 'src/hooks/useCustomers';
import { MergeCustomersDialog } from './MergeCustomersDialog';
import { SplitCustomerNameDialog } from './SplitCustomerNameDialog';

const REASON_LABELS: Record<DuplicateMatchReason, string> = {
  EMAIL: 'Same e-mail',
  PHONE: 'Same phone',
  NAME: 'Same name',
  NAME_EXACT: 'Same name',
};

const customerLabel = (customer: Customer) =>
  [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email || customer.id;

const CustomerCard = ({ customer }: { customer: Customer }) => {
  const { street, streetNumber, postcode, city, country } = customer;
  const line1 = [street, streetNumber].filter(Boolean).join(' ');
  const line2 = [postcode, city].filter(Boolean).join(' ');
  const address = [line1, line2, country].filter(Boolean).join(', ');

  return (
    <div className="flex flex-1 flex-col gap-0.5 rounded-md border border-base-300 p-3 text-sm">
      <span className="font-medium">{customerLabel(customer)}</span>
      {customer.email && <span className="text-muted-foreground">{customer.email}</span>}
      {customer.phone && <span className="text-muted-foreground">{customer.phone}</span>}
      {address && <span className="text-muted-foreground">{address}</span>}
    </div>
  );
};

export const CustomerMergeSuggestions = ({ user }: { user: User }) => {
  const customers = useCustomers();
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const [activePairId, setActivePairId] = React.useState<string | null>(null);
  const [dismissedSplits, setDismissedSplits] = React.useState<Set<string>>(new Set());
  const [activeSplitId, setActiveSplitId] = React.useState<string | null>(null);

  const suggestions = React.useMemo(() => findDuplicateCustomers(customers), [customers]);
  const visibleSuggestions = React.useMemo(
    () => suggestions.filter((suggestion) => !dismissed.has(suggestion.id)),
    [suggestions, dismissed],
  );

  const splitSuggestions = React.useMemo(() => findNameSplitSuggestions(customers), [customers]);
  const visibleSplitSuggestions = React.useMemo(
    () => splitSuggestions.filter((suggestion) => !dismissedSplits.has(suggestion.id)),
    [splitSuggestions, dismissedSplits],
  );

  const activeSuggestion: DuplicateCustomerSuggestion | null =
    visibleSuggestions.find((suggestion) => suggestion.id === activePairId) ?? null;
  const activeSplit: NameSplitSuggestion | null =
    visibleSplitSuggestions.find((suggestion) => suggestion.id === activeSplitId) ?? null;

  const dismiss = (id: string) =>
    setDismissed((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });

  const dismissSplit = (id: string) =>
    setDismissedSplits((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl px-4 py-6">
      <section className="flex flex-col gap-4">
        <PageHeader icon={<MergeIcon className="size-5" />} title="Duplicate suggestions" />

        <p className="text-sm text-muted-foreground">
          These customer records look like they might be duplicates. Review each one and merge the
          pairs you agree with, or dismiss the ones you want to keep separate.
        </p>

        {visibleSuggestions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-base-300 py-12 text-center text-sm text-muted-foreground">
            <PersonIcon className="size-6" />
            No duplicate suggestions right now.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex flex-col gap-3 rounded-md border border-base-300 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {suggestion.reasons.map((reason) => (
                    <Badge key={reason} variant="secondary">
                      {REASON_LABELS[reason]}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <CustomerCard customer={suggestion.customers[0]} />
                  <CustomerCard customer={suggestion.customers[1]} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(suggestion.id)}
                    className="hover:cursor-pointer"
                  >
                    <XIcon className="size-4" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActivePairId(suggestion.id)}
                    className="hover:cursor-pointer"
                  >
                    <MergeIcon className="size-4" />
                    Review &amp; merge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <PageHeader icon={<SplitIcon className="size-5" />} title="Missing surname" />

        <p className="text-sm text-muted-foreground">
          These records have no surname, but their name looks like it holds both a first name and a
          surname. Review each suggested split and save the ones you agree with, or dismiss the rest.
        </p>

        {visibleSplitSuggestions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-base-300 py-12 text-center text-sm text-muted-foreground">
            <PersonIcon className="size-6" />
            No surname suggestions right now.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleSplitSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex flex-col gap-3 rounded-md border border-base-300 p-3"
              >
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">Current name</span>
                  <span className="font-medium">{customerLabel(suggestion.customer)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Suggested split:</span>
                  <Badge variant="secondary">Name: {suggestion.suggestedName}</Badge>
                  <Badge variant="secondary">Surname: {suggestion.suggestedSurname}</Badge>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissSplit(suggestion.id)}
                    className="hover:cursor-pointer"
                  >
                    <XIcon className="size-4" />
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActiveSplitId(suggestion.id)}
                    className="hover:cursor-pointer"
                  >
                    <SplitIcon className="size-4" />
                    Review &amp; save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {activeSuggestion && (
        <MergeCustomersDialog
          customers={activeSuggestion.customers}
          user={user}
          onOpenChange={(open) => {
            if (!open) setActivePairId(null);
          }}
          onMerged={() => {
            // The merged-away record disappears from the real-time customers
            // listener, so this suggestion (and any others involving it) drop
            // out on the next render — just close the dialog.
            setActivePairId(null);
          }}
        />
      )}

      {activeSplit && (
        <SplitCustomerNameDialog
          customer={activeSplit.customer}
          suggestedName={activeSplit.suggestedName}
          suggestedSurname={activeSplit.suggestedSurname}
          user={user}
          onOpenChange={(open) => {
            if (!open) setActiveSplitId(null);
          }}
          onSaved={() => {
            // Once saved the customer has a surname, so it no longer matches the
            // name-split heuristic and drops out on the next render — just close
            // the dialog.
            setActiveSplitId(null);
          }}
        />
      )}
    </div>
  );
};
