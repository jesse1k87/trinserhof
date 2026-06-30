import { type Property } from '@trinserhof/types';

export const getNewProperty = (): Property => ({
  id: '',
  name: '',
  legalName: '',
  website: '',
  email: '',
  phone: '',
  checkInTime: '',
  checkOutTime: '',
  address: '',
  cityTaxPerPersonPerNight: 0,
  taxRegistryNumber: '',
  iban: '',
  bic: '',
});
