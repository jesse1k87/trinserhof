export const getEnvironment = () =>
  window?.location.hostname === 'k.trinserhof.com' ? 'production' : 'development';
