import 'vis-timeline/styles/vis-timeline-graph2d.css';
import * as React from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/esnext';
import { formatCurrency } from '@bookings/helpers';
import { Booking, ROOM_IDS } from '@bookings/types';
import { DataSet } from 'vis-data';

export const Calendar = ({
  bookings,
  setSelectedBookingId,
}: {
  bookings: Booking[];
  setSelectedBookingId: (id: Booking['id']) => void;
}) => {
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
        // snap: function (date, scale, step) {
        //   var hour = 60 * 60 * 1000;
        //   return Math.round(date / hour) * hour;
        // }
      });

      timeline.on('click', (event) => {
        if (event.item && setSelectedBookingId) setSelectedBookingId(event.item);
      });

      timeline.setData({
        items: new DataSet(
          bookings.map((b: Booking) => {
            return {
              id: b.id,
              group: b.roomId ?? 'PENDING',
              content: `${b.email} Price: ${formatCurrency(b.price)} Adults: ${b.adults} Kids: ${b.children}`,
              start: new Date(b.checkIn).setHours(16),
              end: new Date(b.checkOut).setHours(11),
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
