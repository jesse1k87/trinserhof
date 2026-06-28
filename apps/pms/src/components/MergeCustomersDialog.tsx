import * as React from 'react';
import { type Customer, type User } from '@trinserhof/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@trinserhof/ui';
import { mergeCustomerFields } from '@trinserhof/helpers';
import { logAuditEvent, mergeCustomers } from '@trinserhof/supabase';
import useCollection from 'src/hooks/useCollection';
import useRestaurantReservations from 'src/hooks/useRestaurantReservations';
import { toast } from 'sonner';

const customerLabel = (customer: Customer) =>
  [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email || customer.id;

const PREVIEW_FIELDS: Array<{ key: keyof Customer; label: string }> = [
  { key: 'name', label: 'Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Phone' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'language', label: 'Language' },
  { key: 'street', label: 'Street' },
  { key: 'streetNumber', label: 'No.' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
];

const getMergeErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `These customers could not be merged: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  return 'Something went wrong while merging the customers.';
};

export const MergeCustomersDialog = ({
  customers,
  user,
  onOpenChange,
  onMerged,
}: {
  customers: [Customer, Customer];
  user: User;
  onOpenChange: (open: boolean) => void;
  onMerged: (survivor: Customer) => void;
}) => {
  const [primaryId, setPrimaryId] = React.useState(customers[0].id);
  const [isMerging, setIsMerging] = React.useState(false);

  const bookings = useCollection('bookings');
  const restaurantReservations = useRestaurantReservations();

  const primary = customers.find((candidate) => candidate.id === primaryId) ?? customers[0];
  const secondary = customers.find((candidate) => candidate.id !== primary.id) ?? customers[1];

  const preview = mergeCustomerFields(primary, secondary);

  const affectedBookings = bookings.filter((booking) =>
    booking.customers?.includes(secondary.id),
  ).length;
  const affectedReservations = restaurantReservations.filter(
    (reservation) => reservation.customerId === secondary.id,
  ).length;

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const result = await mergeCustomers(primary, secondary);
      logAuditEvent('CUSTOMERS_MERGED', user.email);
      const reassigned = result.bookingsUpdated + result.restaurantReservationsUpdated;
      toast.success(
        reassigned > 0
          ? `Customers merged. Reassigned ${result.bookingsUpdated} booking(s) and ${result.restaurantReservationsUpdated} reservation(s).`
          : 'Customers merged.',
      );
      onMerged(result.survivor);
    } catch (error) {
      console.error(error);
      toast.error(getMergeErrorMessage(error));
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !isMerging && onOpenChange(open)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merge customers</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose which record to keep. The other one is deleted, its bookings and reservations are
            reassigned to the kept customer, and any fields it fills that are empty on the kept
            record are copied over.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {customers.map((candidate) => {
            const isPrimary = candidate.id === primary.id;
            return (
              <button
                key={candidate.id}
                type="button"
                disabled={isMerging}
                onClick={() => setPrimaryId(candidate.id)}
                className={cn(
                  'flex flex-col gap-1 rounded-md border p-3 text-left text-sm hover:cursor-pointer',
                  isPrimary ? 'border-primary bg-base-200' : 'border-base-300 opacity-70',
                )}
              >
                <span className="font-medium">{customerLabel(candidate)}</span>
                {candidate.email && (
                  <span className="text-muted-foreground">{candidate.email}</span>
                )}
                {candidate.phone && (
                  <span className="text-muted-foreground">{candidate.phone}</span>
                )}
                <span
                  className={cn(
                    'mt-1 text-xs',
                    isPrimary ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {isPrimary ? 'Kept' : 'Deleted after merge'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-md border border-base-300 p-3 text-sm">
          <div className="mb-2 text-xs text-muted-foreground">Result preview</div>
          <div className="flex flex-col gap-1">
            {PREVIEW_FIELDS.map(({ key, label }) => {
              const value = preview[key];
              if (!value) return null;
              const filledFromSecondary = !primary[key] && Boolean(secondary[key]);
              return (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right">
                    {value}
                    {filledFromSecondary && (
                      <span className="ml-1 text-xs text-primary">(from other)</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {affectedBookings} booking(s) and {affectedReservations} reservation(s) will be reassigned
          to the kept customer.
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMerging}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={isMerging}>
            {isMerging ? 'Merging…' : 'Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
