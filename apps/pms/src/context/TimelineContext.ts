import * as React from 'react';
import { Timeline } from 'vis-timeline/standalone';

export type TimelineContextValue = React.MutableRefObject<Timeline | null>;

export const TimelineContext = React.createContext<TimelineContextValue>({
  current: null,
});
