import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Booking } from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { DataSet } from 'vis-data';
import { removeTimeFromDate } from '@trinserhof/helpers';
import { DataItem, Timeline, Timeline as VisTimeline } from 'vis-timeline/standalone';
import useCollection from 'src/hooks/useCollection';
import useRooms from 'src/hooks/useRooms';

const getContentOfBooking = (b: Booking) => {
  const lines = [];

  if (b.status !== 'BLOCKED') {
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

const isInThePast = (date: Date): boolean => {
  const today = removeTimeFromDate(new Date())!;
  return date < today;
};

const getItemFromBooking = (booking: Booking): DataItem => {
  const start = removeTimeFromDate(booking.checkIn)!;
  const end = removeTimeFromDate(booking.checkOut)!;
  start.setHours(16);
  end.setHours(11);

  const classNames = ['hover:cursor-pointer', `booking-room-${booking.roomId}`];

  // Fade out past stays that have already been checked out.
  if (booking.status === 'CHECKED_OUT' && isInThePast(end)) {
    classNames.push('booking-past');
  }

  return {
    id: booking.id,
    group: booking.roomId,
    content: getContentOfBooking(booking),
    start,
    end,
    className: classNames.join(' '),
  };
};

export const Calendar = () => {
  const [, setBooking] = React.useContext(BookingContext);
  const timelineRef = React.useContext(TimelineContext);

  const [timeline, setTimeline] = React.useState<Timeline | false>(false);

  const bookings = useCollection('bookings');
  const rooms = useRooms();

  const onClickEscape = (event: KeyboardEvent) => {
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
      const newTimeline = new VisTimeline(container, []);
      setTimeline(newTimeline);
      timelineRef.current = newTimeline;
    }
  }, [container, timeline, bookings]);

  React.useEffect(() => {
    if (timeline) {
      timeline.setOptions({
        editable: false,
        // start: startDate,
        // end: endDate,
        // min: minDate,
        // max: maxDate,
        preferZoom: false,
        zoomable: false,
        orientation: 'top',
        horizontalScroll: true,
        showMinorLabels: true,
        showWeekScale: false,
        margin: {
          item: {
            horizontal: 1,
            vertical: 4,
          },
        },
        // Force the timeline to strictly use days as its primary increment
        timeAxis: {
          scale: 'day',
          step: 1,
        },
        format: {
          minorLabels: (date: Date) => {
            // `date` may be a moment instance at runtime; `new Date(...)` normalizes either case.
            const day = new Date(date);
            const weekday = day.toLocaleDateString('en-US', { weekday: 'short' });
            return `${weekday}\n${day.getDate()}`;
          },
        },
      });

      timeline.setGroups(rooms.map(({ id }) => ({ id, content: id })));

      const todayButton = document.getElementById('today');
      if (todayButton) {
        todayButton.onclick = function () {
          timeline.moveTo(new Date());
        };
      }
    }
  }, [timeline, rooms]);

  React.useEffect(() => {
    if (timeline && bookings.length > 0) {
      timeline.setItems(new DataSet(bookings.map((b: Booking) => getItemFromBooking(b))));
      timeline.off('click');
      timeline.on('click', (event) => setSelectedBookingId(event.item ?? null));
    }
  }, [timeline, bookings]);

  return <div id={containerId} className="w-full" />;
};
