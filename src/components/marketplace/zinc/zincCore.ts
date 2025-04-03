
// Core Zinc API configuration and utilities

export const ZINC_API_BASE_URL = 'https://api.zinc.io/v1';
export const ZINC_API_KEY = '5B394AAF6CD03728E9E33DDF'; // This is a demo key - in production, use environment variables

export const getZincHeaders = () => {
  return new Headers({
    'Authorization': 'Basic ' + btoa(`${ZINC_API_KEY}:`)
  });
};
