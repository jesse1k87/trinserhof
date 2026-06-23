import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb, overwriteRawData } from '@trinserhof/database';
import { OWNER_EMAIL } from '@trinserhof/constants';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  NoEditingAllowed,
  ScrollArea,
  Textarea,
} from '@trinserhof/ui';
import { CalendarIcon, Pencil1Icon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

export const RawData = ({ userEmail }: { userEmail: string | null }) => {
  const [data, setData] = React.useState<unknown>(undefined);
  const [error, setError] = React.useState<string | null>(null);

  // Only the owner may view or overwrite the raw database directly (mirrors the
  // ".read"/".write" rules in database.rules.json and the guard in
  // overwriteRawData). Gates both the menu item and this page's content.
  const isOwner = userEmail === OWNER_EMAIL;

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOwner) return;

    const unsubscribe = onValue(
      ref(getDb()),
      (snapshot) => setData(snapshot.val()),
      (err) => setError(err.message),
    );

    return () => unsubscribe();
  }, [isOwner]);

  const startEditing = () => {
    setDraft(JSON.stringify(data ?? null, null, 2));
    setParseError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setParseError(null);
  };

  // Parse + validate the draft, then open the confirmation dialog.
  const requestSave = () => {
    try {
      JSON.parse(draft);
      setParseError(null);
      setConfirmOpen(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid JSON.');
    }
  };

  const confirmSave = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid JSON.');
      setConfirmOpen(false);
      return;
    }

    setSaving(true);
    try {
      await overwriteRawData(parsed);
      toast.success('Database overwritten.');
      setConfirmOpen(false);
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast.error(
        `Overwrite failed: ${err instanceof Error ? err.message : 'something went wrong.'}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Raw Data</h1>
        {isOwner && !editing && data !== undefined && (
          <Button
            variant="outline"
            onClick={startEditing}
            className="ml-auto gap-2 hover:cursor-pointer"
          >
            <Pencil1Icon />
            Edit
          </Button>
        )}
      </div>

      {!isOwner ? (
        <NoEditingAllowed />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : data === undefined ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="animate-spin" /> Loading...
        </div>
      ) : editing ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-destructive">
            Careful: saving replaces the <strong>entire</strong> database with exactly the JSON
            below. Anything you remove here is deleted.
          </p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="h-[60vh] font-mono text-xs"
          />
          {parseError && <p className="text-sm text-destructive">Invalid JSON: {parseError}</p>}
          <div className="flex items-center gap-2">
            <Button onClick={requestSave} disabled={saving} className="hover:cursor-pointer">
              Save &amp; overwrite
            </Button>
            <Button
              variant="outline"
              onClick={cancelEditing}
              disabled={saving}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-[70vh] rounded-md border p-4">
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => !saving && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite the entire database?</DialogTitle>
            <DialogDescription>
              This replaces every node (bookings, customers, rooms, …) with the JSON you entered.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={saving}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button onClick={confirmSave} disabled={saving} className="hover:cursor-pointer">
              {saving ? 'Overwriting…' : 'Yes, overwrite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
