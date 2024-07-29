import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/esnext';
import { Booking, ROOM_IDS } from '@bookings/types';
import { DataSet } from 'vis-data';
import { emptyBooking } from 'src/constants/emptyBooking';
import { BookingContext } from 'src/context/BookingContext';

export const Calendar = ({ bookings, setDetailsOpen }: { bookings: Booking[]; setDetailsOpen }) => {
  const [booking, setBooking] = React.useContext(BookingContext);

  // React.useEffect(() => {
  //   if (bookings) {
  //     if (bookings[0] && booking.id === emptyBooking.id) {
  //       setBooking(bookings[0]); // Select first booking, mainly for development purposes.
  //     }
  //   }
  // }, [bookings]);

  const setSelectedBookingId = React.useCallback(
    (id: Booking['id']) => {
      if (bookings) {
        const selectedBooking = bookings.find((b: Booking) => b.id === id);
        if (selectedBooking) {
          setBooking(selectedBooking);
          setDetailsOpen(true);
        }
      }
    },
    [bookings],
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 2);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 1);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  const containerId = 'calendar';
  const container = document?.getElementById(containerId);

  let timeline: any = false;

  React.useEffect(() => {
    if (container && bookings) {
      container.innerHTML = '';
      timeline = new VisTimeline(container, [], {
        // start: startDate,
        // end: endDate,
        // min: minDate,
        // max: maxDate,
        orientation: 'top',
        showMinorLabels: true,
        margin: {
          item: 6,
        },
        editable: false,
        stack: true,
        // locale: 'de',
        groupHeightMode: 'fixed',
        // showWeekScale: true,
        // snap: function (date, scale, step) {
        //   var hour = 60 * 60 * 1000;
        //   return Math.round(date / hour) * hour;
        // }
      });

      // timeline.itemsData.update(itemData);

      timeline.on('click', (event) => {
        if (event.item && setSelectedBookingId) setSelectedBookingId(event.item);
      });

      timeline.setData({
        items: new DataSet(
          bookings.map((b: Booking) => {
            return {
              id: b.id,
              group: b.roomId ?? 'PENDING',
              content: b.name && b.name !== '' ? b.name : b.email,
              start: new Date(b.checkIn).setHours(16),
              end: new Date(b.checkOut).setHours(11),
              className: ['hover:cursor-pointer'].join(''),
            };
          }),
        ),
        groups: [
          {
            id: 'PENDING',
          },
          ...ROOM_IDS.map((id) => {
            return { id };
          }),
        ],
      });
    }
  }, [container]);

  return <div id={containerId} className="w-full" />;
};
