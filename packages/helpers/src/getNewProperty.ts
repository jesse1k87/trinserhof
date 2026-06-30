import { type Property } from '@trinserhof/types';

export const getNewProperty = (): Property => ({
  id: '',
  name: '',
  legalName: '',
  website: '',
  phone: '',
  checkInTime: '',
  checkOutTime: '',
  address: '',
  cityTaxPerPersonPerNight: 0,
  taxRegistryNumber: '',
  iban: '',
  bic: '',
});
