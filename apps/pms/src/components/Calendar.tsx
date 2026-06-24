import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Booking, User } from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { DataSet } from 'vis-data';
import { getNewBooking, removeTimeFromDate } from '@trinserhof/helpers';
import { DataItem, Timeline, Timeline as VisTimeline } from 'vis-timeline/standalone';
import useCollection from 'src/hooks/useCollection';
import useRooms from 'src/hooks/useRooms';
import { canCreateBooking } from '@trinserhof/types/src/role';
import { PlusIcon, CalendarIcon } from '@radix-ui/react-icons';
import {
  Button,
  Calendar as DatePickerCalendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui';

const DAYS_TO_SHOW_OPTIONS = [
  { value: '3', label: '3 days' },
  { value: '7', label: 'A week' },
  { value: '30', label: 'A month' },
] as const;

const WIDE_SCREEN_MEDIA_QUERY = '(min-width: 640px)';

const getDefaultAmountOfDaysToShow = () =>
  window.matchMedia(WIDE_SCREEN_MEDIA_QUERY).matches ? 7 : 3;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getContentOfBooking = (b: Booking) => {
  const lines = [];

  if (b.status !== 'BLOCKED') {
    if (b.channel === 'AIRBNB') {
      lines.push('Airbnb');
    }
  }

  lines.push(b.name);

  const statusDot = `<span class="booking-status-dot status-${b.status}" title="${escapeHtml(b.status)}"></span>`;

  return `${statusDot}${escapeHtml(lines.join(' - '))}`;
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

export const Calendar = ({ user }: { user: User }) => {
  const [, setBooking] = React.useContext(BookingContext);
  const timelineRef = React.useContext(TimelineContext);

  const [timeline, setTimeline] = React.useState<Timeline | false>(false);
  const [jumpDate, setJumpDate] = React.useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

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

  const [amountOfDaysToShow, setAmountOfDaysToShow] = React.useState(getDefaultAmountOfDaysToShow);

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
      // vis-timeline strips all attributes from <span> by default when sanitizing
      // item content HTML, which silently drops the class on our status dot.
      const newTimeline = new VisTimeline(container, [], [], {
        xss: {
          disabled: false,
          filterOptions: {
            onIgnoreTagAttr: (tag: string, name: string, value: string) => {
              if (tag === 'span' && name === 'class') {
                return `class="${value.replace(/"/g, '&quot;')}"`;
              }
            },
          },
        },
      });
      setTimeline(newTimeline);
      timelineRef.current = newTimeline;
    }
  }, [container, timeline, bookings]);

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
            const dayMonth = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${weekday}\n${dayMonth}`;
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
  }, [timeline, rooms, amountOfDaysToShow]);

  React.useEffect(() => {
    if (timeline && bookings.length > 0) {
      timeline.setItems(new DataSet(bookings.map((b: Booking) => getItemFromBooking(b))));
      timeline.off('click');
      timeline.on('click', (event) => setSelectedBookingId(event.item ?? null));
    }
  }, [timeline, bookings]);

  return (
    <>
      <div className="flex flex-row gap-1 sm:gap-2 items-start justify-start content-center p-2 mx-1">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              aria-label="Jump to date"
              className="rounded-full hover:cursor-pointer"
            >
              <CalendarIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DatePickerCalendar
              initialFocus
              mode="single"
              selected={jumpDate}
              defaultMonth={jumpDate}
              onSelect={(date: Date | undefined) => {
                if (date) {
                  setJumpDate(date);
                  timelineRef.current?.moveTo(date);
                }
                setDatePickerOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <Button id="today" variant="outline" className="rounded-full hover:cursor-pointer">
          Today
        </Button>
        <Select
          value={String(amountOfDaysToShow)}
          onValueChange={(value) => setAmountOfDaysToShow(Number(value))}
        >
          <SelectTrigger className="rounded-full w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS_TO_SHOW_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          {canCreateBooking(user.role) && (
            <Button
              size="icon"
              onClick={() => setBooking(getNewBooking())}
              className="rounded-full hover:cursor-pointer"
            >
              <PlusIcon />
            </Button>
          )}
        </div>
      </div>
      <div id={containerId} className="w-full" />
    </>
  );
};
