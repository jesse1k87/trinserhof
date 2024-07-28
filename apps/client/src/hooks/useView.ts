import * as React from 'react';

const useView = () => {
  type View = 'table' | 'calendar';

  const [view, setView] = React.useState<View>('table');

  return { view, setView };
};

export default useView;
