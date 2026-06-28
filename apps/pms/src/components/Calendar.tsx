import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import {
  Booking,
  canPerform,
  Customer,
  getRestaurantReservationEnd,
  RestaurantReservation,
  User,
} from '@trinserhof/types';
import { TimelineContext } from 'src/context/TimelineContext';
import { DataSet } from 'vis-data';
import { removeTimeFromDate } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import { DataItem, Timeline, Timeline as VisTimeline } from 'vis-timeline/standalone';
import useBookings from 'src/hooks/useBookings';
import useRooms from 'src/hooks/useRooms';
import useRestaurantTables from 'src/hooks/useRestaurantTables';
import useCustomers from 'src/hooks/useCustomers';
import { PlusIcon, CalendarSearchIcon, BedIcon, UtensilsIcon, EyeIcon } from '@trinserhof/ui';
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
import useRestaurantReservations from '../hooks/useRestaurantReservations';

const DAYS_TO_SHOW_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '1 week' },
  { value: '28', label: '4 weeks' },
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

const getTableGroupContent = (number: number) =>
  `<span class="group-row-content">${UTENSILS_ICON_SVG}<span>${escapeHtml(String(number))}</span></span>`;

const getContentOfBooking = (b: Booking, customerNameById: Map<string, string>) => {
  const statusDot = `<span class="booking-status-dot status-${b.status}" title="${escapeHtml(b.status)}"></span>`;
  const name = customerNameById.get(b.customers[0]) || `${b.adults} guests`;

  return `${statusDot}<span class="booking-name">${escapeHtml(name)}</span>`;
};

const isInThePast = (date: Date): boolean => {
  const today = removeTimeFromDate(new Date())!;
  return date < today;
};

const getItemFromBooking = (booking: Booking, customerNameById: Map<string, string>): DataItem => {
  const start = removeTimeFromDate(booking.checkIn)!;
  const end = removeTimeFromDate(booking.checkOut)!;
  start.setHours(16);
  end.setHours(11);

  const classNames = ['hover:cursor-pointer', `booking-room-${booking.roomId}`];

  classNames.push(`status-${booking.status}`);

  if (booking.status === 'CHECKED_OUT' && isInThePast(end)) {
    classNames.push('booking-past');
  }

  return {
    id: booking.id,
    group: booking.roomId,
    content: getContentOfBooking(booking, customerNameById),
    start,
    end,
    className: classNames.join(' '),
  };
};

const getContentOfRestaurantReservation = (
  reservation: RestaurantReservation,
  customerNameById: Map<string, string>,
) =>
  escapeHtml(
    (reservation.customerId && customerNameById.get(reservation.customerId)) ||
      `${reservation.numberOfPeople} guests`,
  );

const getItemFromRestaurantReservation = (
  reservation: RestaurantReservation,
  customerNameById: Map<string, string>,
): DataItem => {
  const start = new Date(reservation.start);
  const end = getRestaurantReservationEnd(reservation.start);

  const classNames = ['hover:cursor-pointer'];
  if (reservation.tableId) {
    classNames.push(`table-reservation-${reservation.tableId}`);
  }

  if (end < new Date()) {
    classNames.push('table-reservation-past');
  }

  return {
    id: reservation.id,
    group: reservation.tableId,
    content: getContentOfRestaurantReservation(reservation, customerNameById),
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
  navigate: (page: Page, id?: string) => void;
}) => {
  const timelineRef = React.useContext(TimelineContext);

  const [timeline, setTimeline] = React.useState<Timeline | false>(false);
  const [jumpDate, setJumpDate] = React.useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);
  const [visibleItemTypes, setVisibleItemTypes] = React.useState<Set<CalendarItemType>>(
    new Set(['BOOKINGS', 'TABLE_RESERVATIONS']),
  );

  const showBookings = visibleItemTypes.has('BOOKINGS');
  const showRestaurantReservations = visibleItemTypes.has('TABLE_RESERVATIONS');

  const toggleItemType = (type: CalendarItemType, checked: boolean) => {
    setVisibleItemTypes((current) => {
      const next = new Set(current);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  };

  const bookings = useBookings();
  const rooms = useRooms();
  const restaurantReservations = useRestaurantReservations();
  const tables = useRestaurantTables();
  const customers = useCustomers();

  const customerNameById = React.useMemo(
    () =>
      new Map(
        customers.map((c: Customer) => [c.id, [c.name, c.surname].filter(Boolean).join(' ')]),
      ),
    [customers],
  );

  const setSelectedItemId = React.useCallback(
    (id: Booking['id'] | RestaurantReservation['id'] | null) => {
      if (id === null) return;

      const selectedBooking = bookings.find((b: Booking) => b.id === id);
      if (selectedBooking) {
        navigate('booking-detail', selectedBooking.id);
        return;
      }

      const selectedRestaurantReservation = restaurantReservations.find(
        (r: RestaurantReservation) => r.id === id,
      );
      if (selectedRestaurantReservation) {
        navigate('table-reservation-detail', selectedRestaurantReservation.id);
      }
    },
    [bookings, restaurantReservations, navigate],
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
        ...(showBookings ? rooms.map(({ id }) => ({ id, content: getRoomGroupContent(id) })) : []),
        ...(showRestaurantReservations
          ? tables.map(({ id, number }) => ({
              id,
              content: getTableGroupContent(number),
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
  }, [timeline, rooms, tables, amountOfDaysToShow, showBookings, showRestaurantReservations]);

  React.useEffect(() => {
    if (timeline) {
      timeline.setItems(
        new DataSet([
          ...(showBookings
            ? bookings.map((b: Booking) => getItemFromBooking(b, customerNameById))
            : []),
          ...(showRestaurantReservations
            ? restaurantReservations.map((r: RestaurantReservation) =>
                getItemFromRestaurantReservation(r, customerNameById),
              )
            : []),
        ]),
      );
      timeline.off('click');
      timeline.on('click', (event) => setSelectedItemId(event.item ?? null));
    }
  }, [
    timeline,
    bookings,
    restaurantReservations,
    showBookings,
    showRestaurantReservations,
    customerNameById,
  ]);

  return (
    <>
      <div className="flex w-full flex-row gap-1 sm:gap-2 items-center justify-between content-center p-2 mx-1">
        <div className="flex flex-1 justify-start  gap-2">
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
        <div className="flex flex-1 justify-center gap-2">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                aria-label="Jump to date"
                className="rounded-full hover:cursor-pointer"
              >
                <CalendarSearchIcon />
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
        </div>
        <div className="flex flex-1 justify-end gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Bookings"
            title="Bookings"
            aria-pressed={showBookings}
            className={cn(
              'relative rounded-full hover:cursor-pointer',
              showBookings && 'bg-base-200',
            )}
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
            aria-pressed={showRestaurantReservations}
            className={cn(
              'relative rounded-full hover:cursor-pointer',
              showRestaurantReservations && 'bg-base-200',
            )}
            onClick={() => toggleItemType('TABLE_RESERVATIONS', !showRestaurantReservations)}
          >
            <UtensilsIcon />
            {!showRestaurantReservations && (
              <span className="pointer-events-none absolute left-1/2 top-1/2 h-[1px] w-[140%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
            )}
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
        </div>
      </div>
      <div id={containerId} className="w-full" />
    </>
  );
};
