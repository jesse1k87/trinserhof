import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Booking, ROOMS } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import { DataSet } from 'vis-data';
import { removeTimeFromDate } from '@bookings/helpers';
import { Timeline as VisTimeline } from 'vis-timeline/esnext';
import useCollection from 'src/hooks/useCollection';

const roomIdAlgemein = 'Algemein';

const getContentOfBooking = (b: Booking) => {
  const lines = [];

  if (b.status !== 'BLOCKED' && b.roomId !== roomIdAlgemein) {
    const totalAmountOfGuests = b.adults + b.children + b.babies;
    lines.push(totalAmountOfGuests > 0 ? `${totalAmountOfGuests}p` : '🔴');

    lines.push(
      b.priceFixed && b.priceFixed !== '' ? b.priceFixed : b.channel === 'AIRBNB' ? 'Airbnb' : '🔴',
    );
  }

  lines.push(`${b.name ?? '🔴'} ${b.notes && `(${b.notes})`}`);

  return lines.join(' - ');
};

const getItemFromBooking = (booking: Booking) => {
  return {
    id: booking.id,
    group: booking.roomId,
    content: getContentOfBooking(booking),
    start: removeTimeFromDate(booking.checkIn)?.setHours(
      booking.roomId === roomIdAlgemein ? 9 : 16,
    ),
    end: removeTimeFromDate(booking.checkOut)?.setHours(
      booking.roomId === roomIdAlgemein ? 12 : 11,
    ),
    className: [
      'hover:cursor-pointer',
      `booking-room-${booking.roomId}`,
      `booking-status-${booking.status}`,
    ].join(' '),
  };
};

export const Calendar = () => {
  const [booking, setBooking] = React.useContext(BookingContext);

  const bookings = useCollection('bookings');

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

  const clientWidth = document.documentElement.clientWidth;
  const amountOfDaysToShow = clientWidth > 800 ? 8 : clientWidth > 400 ? 6 : 2;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 1);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + amountOfDaysToShow);

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
      timeline = new VisTimeline(container, []);

      timeline.setOptions({
        editable: false,
        start: startDate,
        end: endDate,
        // min: minDate,
        // max: maxDate,
        preferZoom: false,
        zoomable: false,
        orientation: 'both',
        horizontalScroll: true,
        showMinorLabels: true,
        showWeekScale: false,
        margin: {
          item: 1,
        },
      });

      timeline.setGroups([
        { id: roomIdAlgemein },
        ...ROOMS.map(({ id }) => {
          return { id };
        }),
      ]);

      timeline.setItems(new DataSet(bookings.map((b: Booking) => getItemFromBooking(b))));

      timeline.on('click', (event) => setSelectedBookingId(event.item ?? null));

      document.getElementById('today').onclick = function () {
        timeline.moveTo(new Date());
      };

      // if (booking?.checkIn) {
      //   timeline.moveTo(new Date(booking.checkIn));
      // }
    }
  }, [container, bookings]);

  return <div id={containerId} className="w-full" />;
};
