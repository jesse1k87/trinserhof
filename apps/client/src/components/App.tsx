import '../index.css';
import * as React from 'react';
import { Calendar } from './Calendar';
import useView from '../hooks/useView';
import { Menu } from './Menu';
import { Footer } from './Footer';
import { BookingsTable } from './BookingsTable';

export const App = () => {
  const { view, setView } = useView();

  return (
    <div className="flex flex-col">
      <Menu />
      {view === 'table' && <BookingsTable />}
      {view === 'calendar' && <Calendar />}
      <Footer />
    </div>
  );
};
