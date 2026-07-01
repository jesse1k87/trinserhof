import * as React from 'react';
import { canPerform, Property, User } from '@trinserhof/types';
import { getNewProperty, propertiesAreDifferent } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import { Button, HorizontalLine, ICONS, Input, PageHeader, Textarea } from '@trinserhof/ui';
import useProperties from 'src/hooks/useProperties';
import { logAuditEvent, saveProperty } from '@trinserhof/supabase';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid property data:')) {
    return `This property could not be saved: ${error.message.replace('Invalid property data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This property is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the property.';
};

export const PropertyDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const properties = useProperties();

  const originalProperty = isNew ? undefined : properties.find((p) => p.id === id);

  const [property, setProperty] = React.useState<Property | undefined>(() =>
    isNew ? getNewProperty() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setProperty(originalProperty);
  }, [isNew, originalProperty]);

  React.useEffect(() => {
    if (!isNew && properties.length > 0 && !originalProperty) {
      navigate('properties-table');
    }
  }, [isNew, properties.length, originalProperty, navigate]);

  const canCreate = canPerform(user.role, 'PROPERTY', 'CREATE');
  const canUpdate = canPerform(user.role, 'PROPERTY', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!property) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges =
    isNew || (!!originalProperty && propertiesAreDifferent(originalProperty, property));

  const handleSave = async () => {
    try {
      const saved = await saveProperty(property);
      logAuditEvent(originalProperty ? 'PROPERTY_UPDATED' : 'PROPERTY_CREATED', user.email);
      if (isNew) navigate('properties-table');
      else setProperty(saved);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          aria-label="Back to properties"
          className="hover:cursor-pointer"
          onClick={() => navigate('properties-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader
          icon={<ICONS.property className="size-5" />}
          title={isNew ? 'New property' : 'Property'}
        >
          {enabled && hasChanges && <Button onClick={handleSave}>Save</Button>}
        </PageHeader>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Name</div>
        <Input
          placeholder="e.g. Hotel Trinserhof"
          value={property.name}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, name: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Legal name</div>
        <Input
          placeholder="e.g. Hotel Trinserhof GmbH"
          value={property.legalName}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, legalName: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Website</div>
        <Input
          placeholder="e.g. https://www.trinserhof.at"
          value={property.website}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, website: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Email</div>
        <Input
          type="email"
          placeholder="e.g. info@trinserhof.at"
          value={property.email}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, email: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Phone</div>
        <Input
          placeholder="e.g. +43 5275 0000"
          value={property.phone}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, phone: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Address</div>
        <Textarea
          placeholder="Street, postcode, city, country"
          value={property.address}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, address: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-base-content/60">Check-in time</div>
          <Input
            type="time"
            value={property.checkInTime}
            disabled={!enabled}
            onChange={(event) => setProperty({ ...property, checkInTime: event.target.value })}
          />
        </div>
        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-base-content/60">Check-out time</div>
          <Input
            type="time"
            value={property.checkOutTime}
            disabled={!enabled}
            onChange={(event) => setProperty({ ...property, checkOutTime: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">City tax per person per night (€)</div>
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="e.g. 2.60"
          value={
            Number.isNaN(property.cityTaxPerPersonPerNight) ? '' : property.cityTaxPerPersonPerNight
          }
          disabled={!enabled}
          onChange={(event) =>
            setProperty({ ...property, cityTaxPerPersonPerNight: event.target.valueAsNumber })
          }
        />
      </div>

      <HorizontalLine />

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">Tax registry number</div>
        <Input
          placeholder="e.g. ATU00000000"
          value={property.taxRegistryNumber}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, taxRegistryNumber: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">IBAN</div>
        <Input
          placeholder="e.g. AT00 0000 0000 0000 0000"
          value={property.iban}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, iban: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-base-content/60">BIC</div>
        <Input
          placeholder="e.g. XXXXATWW"
          value={property.bic}
          disabled={!enabled}
          onChange={(event) => setProperty({ ...property, bic: event.target.value })}
        />
      </div>
    </div>
  );
};
