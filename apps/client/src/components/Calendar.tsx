import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Booking, ROOMS } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import { CHECK_IN_HOUR, CHECK_OUT_HOUR } from 'src/constants';
import { DataSet } from 'vis-data';
import { removeTimeFromDate } from '@bookings/helpers';
import { Timeline as VisTimeline } from 'vis-timeline/esnext';

const getContentOfBooking = (b: Booking) => {
  const lines = [];

  const totalAmountOfGuests = b.adults + b.children;

  if (totalAmountOfGuests > 0) {
    lines.push(`${totalAmountOfGuests}p`);
  }

  if (b.name) {
    lines.push(b.name);
  }

  if (b.notes && !lines.includes(b.notes)) {
    lines.push(b.notes);
  }

  if (b.price || b.priceFixed) {
    lines.push(`&euro; ${b.priceFixed ?? b.price}`);
  }

  return lines.join(' — ');
};

const getItemFromBooking = (booking: Booking) => {
  return {
    id: booking.id,
    group: booking.roomId ?? 'PENDING',
    content: getContentOfBooking(booking),
    start: removeTimeFromDate(booking.checkIn)?.setHours(CHECK_IN_HOUR),
    end: removeTimeFromDate(booking.checkOut)?.setHours(CHECK_OUT_HOUR),
    className: ['hover:cursor-pointer', `booking-status-${booking.status}`].join(' '),
  };
};

export const Calendar = ({ bookings }: { bookings: Booking[] }) => {
  const [booking, setBooking] = React.useContext(BookingContext);

  const onClickEscape = (event) => {
    if (event.key === 'Escape') {
      setBooking(null);
      document.removeEventListener('keydown', onClickEscape);
    }
  };

  const setSelectedBookingId = React.useCallback(
    (id: Booking['id'] | null) => {
      if (id === null) {
        setBooking(null);
        document.removeEventListener('keydown', onClickEscape);
      } else if (bookings) {
        const selectedBooking = bookings.find((b: Booking) => b.id === id);
        if (selectedBooking) {
          setBooking(selectedBooking);
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
        editable: false,
        start: startDate,
        end: endDate,
        min: minDate,
        max: maxDate,
        orientation: 'top',
        horizontalScroll: true,
        verticalScroll: true,
        showMinorLabels: true,
        stack: true,
        showWeekScale: true,
        margin: {
          item: 2,
        },
        // groupHeightMode: 'fixed',
        // snap: function (date, scale, step) {
        //   var hour = 60 * 60 * 1000;
        //   return Math.round(date / hour) * hour;
        // }
      });

      timeline.setData({
        items: new DataSet(bookings.map((b: Booking) => getItemFromBooking(b))),
        groups: [
          {
            id: '0',
          },
          ...ROOMS.map(({ id }) => {
            return { id };
          }),
        ],
      });

      timeline.on('click', (event) => setSelectedBookingId(event.item ?? null));
    }
  }, [container, bookings]);

  return <div id={containerId} className="w-full" />;
};
