import axios from 'axios';

const NASA_KEY = import.meta.env.VITE_NASA_API_KEY;

const nasaClient = axios.create({
  baseURL: 'https://api.nasa.gov/',
  timeout: 30000, // INCREASED TO 30 SECONDS
  params: {
    api_key: NASA_KEY
  }
});

export const getApod = () => nasaClient.get('planetary/apod');