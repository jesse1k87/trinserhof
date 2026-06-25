import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Booking, canPerform, TableReservation, User } from '@trinserhof/types';
import { BookingContext } from 'src/context/BookingContext';
import { TableReservationContext } from 'src/context/TableReservationContext';
import { TimelineContext } from 'src/context/TimelineContext';
import { DataSet } from 'vis-data';
import { removeTimeFromDate } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import { DataItem, Timeline, Timeline as VisTimeline } from 'vis-timeline/standalone';
import useCollection from 'src/hooks/useCollection';
import useRooms from 'src/hooks/useRooms';
import useTables from 'src/hooks/useTables';
import useTableReservations from 'src/hooks/useTableReservations';
import {
  Plus as PlusIcon,
  Calendar as CalendarIcon,
  BedDouble as BedIcon,
  Utensils as UtensilsCrossedIcon,
  Eye as EyeIcon,
} from 'lucide-react';
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
  cn,
} from '@trinserhof/ui';

const DAYS_TO_SHOW_OPTIONS = [
  { value: '1', label: 'One day' },
  { value: '3', label: '3 days' },
  { value: '7', label: 'One week' },
  { value: '30', label: 'One month' },
] as const;

type CalendarItemType = 'BOOKINGS' | 'TABLE_RESERVATIONS';

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

// Inline copies of lucide-react's BedDouble/UtensilsCrossed icons (rather than rendering
// the React components), since group labels are plain HTML strings consumed by vis-timeline.
// Both icons share the "group-row-icon" class so they render at the same size as each other.
const BED_ICON_SVG =
  '<svg class="group-row-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>';

const UTENSILS_ICON_SVG =
  '<svg class="group-row-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>';

const getRoomGroupContent = (id: string) =>
  `<span class="group-row-content">${BED_ICON_SVG}<span>${escapeHtml(id)}</span></span>`;

const getTableGroupContent = (name: string, nickname: string | undefined) =>
  `<span class="group-row-content">${UTENSILS_ICON_SVG}<span>${escapeHtml(nickname ? `${name} (${nickname})` : name)}</span></span>`;

const getContentOfBooking = (b: Booking) => {
  const statusDot = `<span class="booking-status-dot status-${b.status}" title="${escapeHtml(b.status)}"></span>`;

  return `${statusDot}${escapeHtml('... TODO! Put first customer name here')}`;
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

const getContentOfTableReservation = (reservation: TableReservation) =>
  escapeHtml(reservation.name || `${reservation.numberOfPeople} guests`);

const getItemFromTableReservation = (reservation: TableReservation): DataItem => {
  const start = new Date(reservation.start);
  const end = new Date(reservation.end);

  const classNames = ['hover:cursor-pointer', `table-reservation-${reservation.tableId}`];

  if (end < new Date()) {
    classNames.push('table-reservation-past');
  }

  return {
    id: reservation.id,
    group: reservation.tableId,
    content: getContentOfTableReservation(reservation),
    start,
    end,
    className: classNames.join(' '),
  };
};

export const Calendar = ({
  user,
  navigate,
}: {
  user: User;
  navigate: (page: Page) => void;
}) => {
  const [, setBooking] = React.useContext(BookingContext);
  const [, setTableReservation] = React.useContext(TableReservationContext);
  const timelineRef = React.useContext(TimelineContext);

  const [timeline, setTimeline] = React.useState<Timeline | false>(false);
  const [jumpDate, setJumpDate] = React.useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [visibleItemTypes, setVisibleItemTypes] = React.useState<Set<CalendarItemType>>(
    new Set(['BOOKINGS', 'TABLE_RESERVATIONS']),
  );

  const showBookings = visibleItemTypes.has('BOOKINGS');
  const showTableReservations = visibleItemTypes.has('TABLE_RESERVATIONS');

  const toggleItemType = (type: CalendarItemType, checked: boolean) => {
    setVisibleItemTypes((current) => {
      const next = new Set(current);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  };

  const bookings = useCollection('bookings');
  const rooms = useRooms();
  const tableReservations = useTableReservations();
  const tables = useTables();

  const onClickEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setBooking(null);
      setTableReservation(null);
      document.removeEventListener('keydown', onClickEscape);
    }
  };

  const setSelectedItemId = React.useCallback(
    (id: Booking['id'] | TableReservation['id'] | null) => {
      if (id === null) {
        setBooking(null);
        setTableReservation(null);
        document.removeEventListener('keydown', onClickEscape);
        return;
      }

      const selectedBooking = bookings.find((b: Booking) => b.id === id);
      if (selectedBooking) {
        setBooking(selectedBooking);
        document.addEventListener('keydown', onClickEscape);
        return;
      }

      const selectedTableReservation = tableReservations.find((r: TableReservation) => r.id === id);
      if (selectedTableReservation) {
        setTableReservation(selectedTableReservation);
        document.addEventListener('keydown', onClickEscape);
      }
    },
    [bookings, tableReservations],
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
            // svg/path aren't in the sanitizer's default whitelist, so they'd otherwise be
            // escaped to literal text. Our group-row icon markup is developer-controlled
            // (not user input), so it's safe to let these two tags through unmodified.
            onIgnoreTag: (tag: string, html: string) => {
              if (tag === 'svg' || tag === 'path') {
                return html;
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
            // vis-timeline sets label text via innerHTML, so a literal \n collapses to
            // whitespace in HTML — an actual <br> tag is needed for a visible line break.
            return `${weekday}<br>${dayMonth}`;
          },
        },
      });

      timeline.setGroups([
        ...(showBookings
          ? rooms.map(({ id }) => ({ id, content: getRoomGroupContent(id) }))
          : []),
        ...(showTableReservations
          ? tables.map(({ id, name, nickname }) => ({
              id,
              content: getTableGroupContent(name, nickname),
            }))
          : []),
      ]);

      const todayButton = document.getElementById('today');
      if (todayButton) {
        todayButton.onclick = function () {
          timeline.moveTo(new Date());
        };
      }
    }
  }, [timeline, rooms, tables, amountOfDaysToShow, showBookings, showTableReservations]);

  React.useEffect(() => {
    if (timeline) {
      timeline.setItems(
        new DataSet([
          ...(showBookings ? bookings.map((b: Booking) => getItemFromBooking(b)) : []),
          ...(showTableReservations
            ? tableReservations.map((r: TableReservation) => getItemFromTableReservation(r))
            : []),
        ]),
      );
      timeline.off('click');
      timeline.on('click', (event) => setSelectedItemId(event.item ?? null));
    }
  }, [timeline, bookings, tableReservations, showBookings, showTableReservations]);

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
          <SelectTrigger className="rounded-full w-auto justify-start gap-2">
            <EyeIcon className="h-4 w-4 shrink-0" />
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
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Bookings"
          title="Bookings"
          aria-pressed={showBookings}
          className={cn('relative rounded-full hover:cursor-pointer', showBookings && 'bg-base-200')}
          onClick={() => toggleItemType('BOOKINGS', !showBookings)}
        >
          <BedIcon />
          {!showBookings && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[140%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label="Table reservations"
          title="Table reservations"
          aria-pressed={showTableReservations}
          className={cn(
            'relative rounded-full hover:cursor-pointer',
            showTableReservations && 'bg-base-200',
          )}
          onClick={() => toggleItemType('TABLE_RESERVATIONS', !showTableReservations)}
        >
          <UtensilsCrossedIcon />
          {!showTableReservations && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[140%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
          )}
        </Button>
        <div>
          {canPerform(user.role, 'BOOKING', 'CREATE') && (
            <Button
              size="icon"
              onClick={() => navigate('booking-create')}
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
