import { AccountingCategory } from '@trinserhof/types';
import * as React from 'react';

export type AccountingCategoryContextType = AccountingCategory | null;

export type AccountingCategoryContextValue = [
  AccountingCategoryContextType,
  React.Dispatch<React.SetStateAction<AccountingCategoryContextType>>,
];

export const AccountingCategoryContext = React.createContext<AccountingCategoryContextValue>([
  null,
  () => {},
]);
