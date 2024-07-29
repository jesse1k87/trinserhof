import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/esnext';
import { Booking, ROOMS } from '@bookings/types';
import { DataSet } from 'vis-data';
import { BookingContext } from 'src/context/BookingContext';

export const Calendar = ({
  bookings,
  setDetailsOpen,
}: {
  bookings: Booking[];
  setDetailsOpen: (value: boolean) => void;
}) => {
  const [booking, setBooking] = React.useContext(BookingContext);

  // React.useEffect(() => {
  //   if (bookings) {
  //     if (bookings[0] && booking.id === emptyBooking.id) {
  //       setBooking(bookings[0]); // Select first booking, mainly for development purposes.
  //     }
  //   }
  // }, [bookings]);

  const onClickEscape = (event) => {
    if (event.key === 'Escape') {
      setBooking(null);
      setDetailsOpen(false);
      document.removeEventListener('keydown', onClickEscape);
    }
  };

  const setSelectedBookingId = React.useCallback(
    (id: Booking['id'] | null) => {
      if (id === null) {
        setBooking(null);
        setDetailsOpen(false);
        document.removeEventListener('keydown', onClickEscape);
      } else if (bookings) {
        const selectedBooking = bookings.find((b: Booking) => b.id === id);
        if (selectedBooking) {
          setBooking(selectedBooking);
          setDetailsOpen(true);
          document.addEventListener('keydown', onClickEscape);
        }
      }
    },
    [bookings],
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 2);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 10);

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
        start: startDate,
        end: endDate,
        min: minDate,
        max: maxDate,
        orientation: 'top',
        showMinorLabels: true,
        margin: {
          item: 6,
        },
        editable: false,
        stack: true,
        groupHeightMode: 'fixed',
        // showWeekScale: true,
        // snap: function (date, scale, step) {
        //   var hour = 60 * 60 * 1000;
        //   return Math.round(date / hour) * hour;
        // }
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
          ...ROOMS.map(({ id }) => {
            return { id };
          }),
        ],
      });

      timeline.on('click', (event) => setSelectedBookingId(event.item ?? null));
      // timeline.itemsData.update(itemData);
    }
  }, [container]);

  return <div id={containerId} className="w-full" />;
};
