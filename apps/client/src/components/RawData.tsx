import * as React from 'react';
import { onValue, ref } from 'firebase/database';
import { getDb } from '@trinserhof/database';
import { Button, NoEditingAllowed, ScrollArea } from '@trinserhof/ui';
import { ArrowLeftIcon, CalendarIcon } from '@radix-ui/react-icons';

export const RawData = ({ isAdmin, onBack }: { isAdmin: boolean; onBack: () => void }) => {
  const [data, setData] = React.useState<unknown>(undefined);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onValue(
      ref(getDb()),
      (snapshot) => setData(snapshot.val()),
      (err) => setError(err.message),
    );

    return () => unsubscribe();
  }, [isAdmin]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl px-4 py-6">
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={onBack}
          className="rounded-full hover:cursor-pointer"
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-lg font-semibold">Raw Database Data</h1>
      </div>

      {!isAdmin ? (
        <NoEditingAllowed />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : data === undefined ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="animate-spin" /> Loading...
        </div>
      ) : (
        <ScrollArea className="h-[70vh] rounded-md border p-4">
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(data, null, 2)}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
};
