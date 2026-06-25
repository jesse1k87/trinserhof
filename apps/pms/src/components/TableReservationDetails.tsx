import * as React from 'react';
import { Customer, canPerform, User } from '@trinserhof/types';
import { TableReservationContext } from 'src/context/TableReservationContext';
import { CustomerContext } from 'src/context/CustomerContext';
import { getNewCustomer, isValidEmailAddress, tableReservationsAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import { Input } from '@trinserhof/ui/src/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@trinserhof/ui/src/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@trinserhof/ui/src/components/popover';
import { NumberPicker } from '@trinserhof/ui';
import useCustomers from 'src/hooks/useCustomers';
import useTableReservations from 'src/hooks/useTableReservations';
import useTables from 'src/hooks/useTables';
import {
  deleteTableReservation,
  logAuditEvent,
  saveCustomer,
  saveTableReservation,
} from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';
import {
  ChevronsUpDown as CaretSortIcon,
  Check as CheckIcon,
  X as Cross2Icon,
  User as PersonIcon,
  Plus as PlusIcon,
} from 'lucide-react';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid table reservation data:')) {
    return `This table reservation could not be saved: ${error.message.replace('Invalid table reservation data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This table reservation is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the table reservation.';
};

const getDeleteErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'You do not have permission to delete this table reservation.';
  }
  return 'Something went wrong while deleting the table reservation.';
};

const getCustomerSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `This customer could not be saved: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This customer is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the customer.';
};

// <input type="datetime-local"> works in local time with no timezone suffix,
// while the reservation stores a timezone-aware ISO string - convert at the edges.
const toLocalInputValue = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalInputValue = (value: string) => new Date(value).toISOString();

export const TableReservationDetails = ({ user }: { user: User }) => {
  const [tableReservation, setTableReservation] = React.useContext(TableReservationContext);
  const [, setCustomer] = React.useContext(CustomerContext);

  const [customerPickerOpen, setCustomerPickerOpen] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [draftCustomer, setDraftCustomer] = React.useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = React.useState(false);

  const tableReservations = useTableReservations();
  const tables = useTables();
  const customers = useCustomers();

  const originalTableReservation = tableReservations?.find(
    (reservation) => reservation.id === tableReservation?.id,
  );

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalTableReservation);

  React.useEffect(() => {
    if (!tableReservation) return;
    setHasChanges(
      Boolean(
        !originalTableReservation ||
        tableReservationsAreDifferent(originalTableReservation, tableReservation),
      ),
    );
  }, [tableReservation, tableReservations]);

  if (!tableReservation) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'TABLE_RESERVATION', 'UPDATE');

  const linkedCustomer = customers.find((c) => c.id === tableReservation.customerId);

  const selectCustomer = (selected: Customer) => {
    const isLinked = tableReservation.customerId === selected.id;
    setTableReservation({
      ...tableReservation,
      customerId: isLinked ? undefined : selected.id,
    });
  };

  const handleSave = async () => {
    try {
      setTableReservation(await saveTableReservation(tableReservation));
      logAuditEvent(
        originalTableReservation ? 'TABLE_RESERVATION_UPDATED' : 'TABLE_RESERVATION_CREATED',
        user.email,
      );
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTableReservation(tableReservation.id);
      logAuditEvent('TABLE_RESERVATION_DELETED', user.email);
      setTableReservation(null);
    } catch (error) {
      toast.error(getDeleteErrorMessage(error));
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && setTableReservation(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Table reservation details</SheetTitle>
        {!enabled && <NoEditingAllowed />}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Customer</div>

          {linkedCustomer && (
            <div className="flex flex-row gap-2 items-center">
              <div className="flex-1 rounded-md border px-3 py-2 text-sm">
                {linkedCustomer.name || linkedCustomer.email}
                <div className="text-xs text-muted-foreground">{linkedCustomer.email}</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="View customer"
                className="hover:cursor-pointer"
                onClick={() => setCustomer(linkedCustomer)}
              >
                <PersonIcon />
              </Button>
              {enabled && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove customer"
                  className="hover:cursor-pointer"
                  onClick={() => selectCustomer(linkedCustomer)}
                >
                  <Cross2Icon />
                </Button>
              )}
            </div>
          )}

          {!linkedCustomer && (
            <Popover
              open={customerPickerOpen}
              onOpenChange={(open) => {
                setCustomerPickerOpen(open);
                if (!open) {
                  setDraftCustomer(null);
                  setCustomerSearch('');
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerPickerOpen}
                  disabled={!enabled}
                  className="justify-between hover:cursor-pointer"
                >
                  Add customer to reservation
                  <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                {draftCustomer ? (
                  <div className="flex flex-col gap-2 p-3">
                    <div className="text-xs text-muted-foreground">New customer</div>
                    <Input
                      placeholder="Name"
                      value={draftCustomer.name}
                      onChange={(event) =>
                        setDraftCustomer({ ...draftCustomer, name: event.target.value })
                      }
                    />
                    <Input
                      placeholder="E-mail (optional)"
                      value={draftCustomer.email ?? ''}
                      onChange={(event) =>
                        setDraftCustomer({ ...draftCustomer, email: event.target.value })
                      }
                    />
                    <Input
                      placeholder="Phone (optional)"
                      value={draftCustomer.phone ?? ''}
                      onChange={(event) =>
                        setDraftCustomer({ ...draftCustomer, phone: event.target.value })
                      }
                    />
                    <div className="flex flex-row justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setDraftCustomer(null)}>
                        Back
                      </Button>
                      <Button
                        size="sm"
                        disabled={
                          savingCustomer ||
                          !draftCustomer.name.trim() ||
                          Boolean(draftCustomer.email && !isValidEmailAddress(draftCustomer.email))
                        }
                        onClick={async () => {
                          setSavingCustomer(true);
                          try {
                            const saved = await saveCustomer(draftCustomer);
                            logAuditEvent('CUSTOMER_CREATED', user.email);

                            setTableReservation({ ...tableReservation, customerId: saved.id });

                            setDraftCustomer(null);
                            setCustomerSearch('');
                            setCustomerPickerOpen(false);
                          } catch (error) {
                            toast.error(getCustomerSaveErrorMessage(error));
                          } finally {
                            setSavingCustomer(false);
                          }
                        }}
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
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              keywords={[c.name, c.email ?? '', c.phone ?? '']}
                              onSelect={() => {
                                selectCustomer(c);
                                setCustomerPickerOpen(false);
                              }}
                            >
                              <div>
                                {c.name || c.email}
                                <div className="text-xs text-muted-foreground">{c.email}</div>
                              </div>
                              <CheckIcon className="ml-auto h-4 w-4 opacity-0" />
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
                          const trimmed = customerSearch.trim();
                          setDraftCustomer({
                            ...getNewCustomer(),
                            ...(trimmed.includes('@') ? { email: trimmed } : { name: trimmed }),
                          });
                        }}
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create new customer
                        {customerSearch.trim() && ` "${customerSearch.trim()}"`}
                      </button>
                    </div>
                  </>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Table</div>
          <Select
            defaultValue={tableReservation.tableId}
            disabled={!enabled}
            onValueChange={(newTableId: string) =>
              setTableReservation({ ...tableReservation, tableId: newTableId })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tables.map(({ id, number }) => (
                <SelectItem key={id} value={id}>
                  {number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Start</div>
          <Input
            type="datetime-local"
            value={toLocalInputValue(tableReservation.start)}
            disabled={!enabled}
            onChange={(event) =>
              setTableReservation({
                ...tableReservation,
                start: fromLocalInputValue(event.target.value),
              })
            }
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">End</div>
          <Input
            type="datetime-local"
            value={toLocalInputValue(tableReservation.end)}
            disabled={!enabled}
            onChange={(event) =>
              setTableReservation({
                ...tableReservation,
                end: fromLocalInputValue(event.target.value),
              })
            }
          />
        </div>

        <NumberPicker
          label="Number of people"
          disabled={!enabled}
          minAmount={1}
          maxAmount={50}
          initialAmount={tableReservation.numberOfPeople}
          onChange={(newValue: number) =>
            setTableReservation({ ...tableReservation, numberOfPeople: newValue })
          }
        />

        {enabled && (
          <div className="flex flex-row justify-between w-full">
            <div className="flex flex-col gap-1">
              {canPerform(user.role, 'TABLE_RESERVATION', 'DELETE') && originalTableReservation && (
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setTableReservation(originalTableReservation ?? null)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row justify-center items-center content-center text-xs text-muted-foreground mt-4 grid gap-2">
          <div className="text-center">{tableReservation.id}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
