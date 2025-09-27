
// /src/hooks/useTimer.ts

import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialTotalTime: number, isActive: boolean, startTime: string | null) => {
  const [currentTime, setCurrentTime] = useState(initialTotalTime);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create the worker instance
    const worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    // Listen for messages from the worker
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'tick') {
        setCurrentTime(e.data.time);
      }
    };

    // Start the timer in the worker if it was already active
    if (isActive && startTime) {
      const sessionTime = Date.now() - new Date(startTime).getTime();
      worker.postMessage({ 
        command: 'start', 
        payload: { totalTime: initialTotalTime, sessionTime }
      });
    }

    // Cleanup on unmount
    return () => {
      worker.terminate();
    };
  }, []); // Empty dependency array ensures this runs only once

  const start = (startTime: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'start', payload: { totalTime: startTime } });
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
            command: 'start', 
            payload: { totalTime: totalTime, sessionTime: sessionTime }
        });
    }
  };

  return { currentTime, start, pause, stop, resume };
};
