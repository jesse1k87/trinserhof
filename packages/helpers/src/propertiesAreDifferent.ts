import { Property } from '@trinserhof/types';

export const propertiesAreDifferent = (a: Property, b: Property) =>
  a.name !== b.name ||
  a.legalName !== b.legalName ||
  a.website !== b.website ||
  a.email !== b.email ||
  a.phone !== b.phone ||
  a.checkInTime !== b.checkInTime ||
  a.checkOutTime !== b.checkOutTime ||
  a.address !== b.address ||
  a.cityTaxPerPersonPerNight !== b.cityTaxPerPersonPerNight ||
  a.taxRegistryNumber !== b.taxRegistryNumber ||
  a.iban !== b.iban ||
  a.bic !== b.bic;
