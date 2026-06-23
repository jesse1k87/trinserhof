import { Customer } from '@trinserhof/types';

export const customersAreDifferent = (a: Customer, b: Customer) => {
  const properties: Array<keyof Customer> = ['name', 'email', 'phone', 'dateOfBirth', 'deleted'];

  return properties.some((property) => a[property] !== b[property]);
};
