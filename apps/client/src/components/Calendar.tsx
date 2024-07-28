import * as React from 'react';
import useCollection from '../hooks/useBookings';
import { DataSet } from 'vis-data/peer';
import { Timeline } from 'vis-timeline/esnext';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { formatCurrency } from '@bookings/helpers';
import { Booking, Room, ROOM_IDS } from '@bookings/types';

export const Calendar = () => {
  const elementId = 'calendar';

  const bookings = useCollection('bookings');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 2);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 1);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  if (bookings.length > 0) {
    const rooms: Array<Room['id'] | Booking['status']> = [];

    const data = bookings.map((b: Booking) => {
      const group = b.roomId ?? b.status;
      rooms.push(group);

      return {
        id: b.id,
        group,
        content: `Price: ${formatCurrency(b.price)} Adults: ${b.adults} Kids: ${b.children}`,
        start: new Date(b.checkIn).setHours(16),
        end: new Date(b.checkOut).setHours(11),
      };
    });

    const items = new DataSet(data);
    const groups = [
      {
        id: 'PENDING',
      },
      ...ROOM_IDS.map((id) => {
        return { id };
      }),
    ];

    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    new Timeline(container, items, groups, {
      start: startDate,
      end: endDate,
      min: minDate,
      max: maxDate,
      orientation: 'top',
      showMinorLabels: true,
      margin: {
        item: 6,
      },
      editable: true,
      stack: true,
      locale: 'de',
      groupHeightMode: 'fixed',
      // showWeekScale: true,
    });
  }

  return <div id={elementId} className="ml-12 w-full" />;
};
