import { ABSTRACT_WAVE_BACKGROUND } from '../constants';

/**
 * A custom hook that provides a static background image URL.
 * The dynamic fetching logic has been replaced to use a single, reliable,
 * embedded image, removing the need for geolocation or network requests for the background.
 */
export const useDynamicBackground = () => {
  return { imageUrl: ABSTRACT_WAVE_BACKGROUND };
};