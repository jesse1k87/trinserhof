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
  Input,
  Label,
} from '@trinserhof/ui';
import { logAuditEvent, saveCustomer } from '@trinserhof/supabase';
import { toast } from 'sonner';

const customerLabel = (customer: Customer) =>
  [customer.name, customer.surname].filter(Boolean).join(' ') || customer.email || customer.id;

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid customer data:')) {
    return `This customer could not be saved: ${error.message.replace('Invalid customer data: ', '')}`;
  }
  return 'Something went wrong while saving the customer.';
};

export const SplitCustomerNameDialog = ({
  customer,
  suggestedName,
  suggestedSurname,
  user,
  onOpenChange,
  onSaved,
}: {
  customer: Customer;
  suggestedName: string;
  suggestedSurname: string;
  user: User;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Customer) => void;
}) => {
  const [name, setName] = React.useState(suggestedName);
  const [surname, setSurname] = React.useState(suggestedSurname);
  const [isSaving, setIsSaving] = React.useState(false);

  const trimmedName = name.trim();
  const trimmedSurname = surname.trim();
  const canSave = trimmedName.length > 0 && trimmedSurname.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const updated = await saveCustomer({
        ...customer,
        name: trimmedName,
        surname: trimmedSurname,
      });
      logAuditEvent('CUSTOMER_UPDATED', user.email);
      toast.success('Customer updated.');
      onSaved(updated);
    } catch (error) {
      console.error(error);
      toast.error(getSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !isSaving && onOpenChange(open)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Split name into name &amp; surname</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This record has no surname and its name looks like it holds both a first name and a
            surname. Review the suggested split below and save it.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-base-300 p-3 text-sm">
          <div className="mb-1 text-xs text-muted-foreground">Current name</div>
          <span className="font-medium">{customerLabel(customer)}</span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="split-name">Name</Label>
            <Input
              id="split-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="split-surname">Surname</Label>
            <Input
              id="split-surname"
              value={surname}
              onChange={(event) => setSurname(event.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !canSave}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
