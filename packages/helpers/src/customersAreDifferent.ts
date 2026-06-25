import { Customer } from '@trinserhof/types';

export const customersAreDifferent = (a: Customer, b: Customer) => {
  const properties: Array<keyof Customer> = [
    'name',
    'surname',
    'email',
    'phone',
    'dateOfBirth',
    'nationality',
    'language',
    'street',
    'streetNumber',
    'postcode',
    'city',
    'country',
  ];

  return properties.some((property) => a[property] !== b[property]);
};
