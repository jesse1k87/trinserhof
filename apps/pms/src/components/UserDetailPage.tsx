import * as React from 'react';
import { canPerform, DEFAULT_LOCALE, type Locale, type User } from '@trinserhof/types';
import { setUserLocale } from '@trinserhof/supabase';
import { toast } from 'sonner';
import { type Page } from 'src/types/page';
import { Button, ICONS, PageHeader } from '@trinserhof/ui';
import useUsers from 'src/hooks/useUsers';
import { LocaleSelect } from './LocaleSelect';

export const UserDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const users = useUsers();
  const targetUser = users.find((u) => u.id === id);

  const [locale, setLocale] = React.useState<Locale>(DEFAULT_LOCALE);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (targetUser) setLocale(targetUser.locale ?? DEFAULT_LOCALE);
  }, [targetUser]);

  React.useEffect(() => {
    if (users.length > 0 && !targetUser) {
      navigate('users-table');
    }
  }, [users.length, targetUser, navigate]);

  if (!targetUser) return null;

  const isSelf = targetUser.id === user.id;
  const canEdit = isSelf || canPerform(user.role, 'USER', 'UPDATE');

  const handleLocaleChange = async (nextLocale: Locale) => {
    const previousLocale = locale;
    setLocale(nextLocale);
    setSaving(true);
    try {
      await setUserLocale(targetUser.id, nextLocale);
      toast.success('Locale updated.');
    } catch (error) {
      setLocale(previousLocale);
      toast.error(error instanceof Error ? error.message : 'Failed to update locale.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          aria-label="Back to users"
          className="hover:cursor-pointer"
          onClick={() => navigate('users-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader icon={<ICONS.users className="size-5" />} title="User" />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Email</div>
        <div className="flex items-center gap-2">
          {targetUser.image ? (
            <img
              src={targetUser.image}
              alt={targetUser.email}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-full bg-base-200 flex items-center justify-center text-xs">
              {targetUser.email[0]?.toUpperCase()}
            </div>
          )}
          <span>{targetUser.email}</span>
        </div>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Locale</div>
        <LocaleSelect value={locale} onSelect={handleLocaleChange} disabled={!canEdit || saving} />
        <div className="pt-1 text-xs text-base-content/60">
          Used to format dates, times, and currency for this user. Falls back to {DEFAULT_LOCALE}{' '}
          when unset.
        </div>
      </div>
    </div>
  );
};
