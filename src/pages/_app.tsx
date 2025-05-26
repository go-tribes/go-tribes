import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { LoadScript } from '@react-google-maps/api';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LoadScript
      googleMapsApiKey="AIzaSyAiX0893WCTopsnxsnwKKj6iUxLW-72nsM" // ✅ must be a valid key
      libraries={['places']} // ✅ must include 'places'
    >
      <Component {...pageProps} />
    </LoadScript>
  );
}

export default MyApp;
