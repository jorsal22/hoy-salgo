import { useEffect, useState } from 'react';

const CLOCK_UPDATE_INTERVAL_MS = 60 * 1000;

export default function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(
      () => setCurrentTime(Date.now()),
      CLOCK_UPDATE_INTERVAL_MS
    );
    return () => clearInterval(intervalId);
  }, []);

  return currentTime;
}
