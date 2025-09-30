
// /src/hooks/useTimer.ts

import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialTotalTime: number, isActive: boolean, startTime: string | null) => {
  const [currentTime, setCurrentTime] = useState(initialTotalTime);
  const workerRef = useRef<Worker | null>(null);

  // Effect to create and manage the worker lifecycle
  useEffect(() => {
    // Create worker only once
    if (!workerRef.current) {
      const worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
        type: 'module'
      });
      workerRef.current = worker;
    }

    // On component unmount, we don't do anything, so the worker persists.
    return () => {
      // Optional: you might want to send a 'pause' command when the component unmounts
      // if (workerRef.current) {
      //   workerRef.current.postMessage({ command: 'pause' });
      // }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect to control the timer and handle messages
  useEffect(() => {
    if (workerRef.current) {
      // Set up message listener for this instance
      workerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'tick') {
          setCurrentTime(e.data.time);
        }
      };

      if (isActive && startTime) {
        const sessionTime = Date.now() - new Date(startTime).getTime();
        workerRef.current.postMessage({
          command: 'set_time',
          payload: { totalTime: initialTotalTime }
        });
        workerRef.current.postMessage({ 
          command: 'start', 
          payload: { sessionTime }
        });
      } else {
        workerRef.current.postMessage({ command: 'pause' });
      }
    }
  }, [isActive, startTime, initialTotalTime]);

  const start = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'start' });
    }
  };

  const pause = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'pause' });
    }
  };

  const stop = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'stop' });
    }
  };

  const resume = (startTime: string | null, totalTime: number) => {
    if (workerRef.current && startTime) {
        const sessionTime = Date.now() - new Date(startTime).getTime();
        workerRef.current.postMessage({ 
            command: 'set_time', 
            payload: { totalTime: totalTime }
        });
        workerRef.current.postMessage({ 
            command: 'start', 
            payload: { sessionTime: sessionTime }
        });
    }
  };

  return { currentTime, start, pause, stop, resume };
};
