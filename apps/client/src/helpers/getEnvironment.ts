export const getEnvironment = () =>
  window?.location.hostname === 'trinserhof.netlify.com' ? 'production' : 'development';
