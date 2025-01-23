import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Booking, ROOMS } from '@bookings/types';
import { BookingContext } from 'src/context/BookingContext';
import { DataSet } from 'vis-data';
import { removeTimeFromDate } from '@bookings/helpers';
import { Timeline, Timeline as VisTimeline } from 'vis-timeline/esnext';
import useCollection from 'src/hooks/useCollection';

const roomIdAlgemein = 'Algemein';

const getContentOfBooking = (b: Booking) => {
  const lines = [];

  if (b.status !== 'BLOCKED' && b.roomId !== roomIdAlgemein) {
    const totalAmountOfGuests = b.adults + b.children + b.babies;

    if (totalAmountOfGuests > 0) {
      lines.push(`${totalAmountOfGuests}p`);
    }

    if (b.channel === 'AIRBNB') {
      lines.push('Airbnb');
    }
  }

  const notes = typeof b.notes === 'string' && b.notes !== '' ? ` (${b.notes})` : '';

  lines.push(b.name ? `${b.name}${notes}` : `No name${notes}`);

  if (b.priceFixed && b.priceFixed !== '') {
    lines.push(b.priceFixed);
  }

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

  const [timeline, setTimeline] = React.useState<Timeline | false>(false);

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

  React.useEffect(() => {
    if (container && !timeline) {
      container.innerHTML = '';
      setTimeline(new VisTimeline(container, []));
    }
  }, [container, timeline, bookings]);

  var selectedDate = new Date();

  React.useEffect(() => {
    if (timeline) {
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

      document.getElementById('today').onclick = function () {
        timeline.moveTo(new Date());
      };
      document.getElementById('prevMonth').onclick = function () {
        selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        selectedDate.setMonth(selectedDate.getMonth() - 1);
        timeline.moveTo(selectedDate);
      };
      document.getElementById('nextMonth').onclick = function () {
        selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        selectedDate.setMonth(selectedDate.getMonth() + 1);
        timeline.moveTo(selectedDate);
      };
    }
  }, [timeline, selectedDate]);

  React.useEffect(() => {
    if (timeline && bookings.length > 0) {
      timeline.setItems(new DataSet(bookings.map((b: Booking) => getItemFromBooking(b))));
      timeline.on('click', (event) => setSelectedBookingId(event.item ?? null));
    }
  }, [timeline, bookings]);

  return <div id={containerId} className="w-full" />;
};
