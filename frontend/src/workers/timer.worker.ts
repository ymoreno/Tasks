
// /src/workers/timer.worker.ts

let interval: NodeJS.Timeout | null = null;
let totalTime = 0;
let sessionStart = 0;
let isActive = false;

self.onmessage = (e: MessageEvent) => {
  const { command, payload } = e.data;

  switch (command) {
    case 'start':
      if (!isActive) {
        sessionStart = Date.now() - (payload?.sessionTime ?? 0);
        isActive = true;
      }
      
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        const sessionTime = Date.now() - sessionStart;
        self.postMessage({ type: 'tick', time: totalTime + sessionTime });
      }, 100);
      break;

    case 'pause':
    case 'stop':
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      isActive = false;
      break;
      
    case 'reset':
      if (interval) clearInterval(interval);
      interval = null;
      isActive = false;
      totalTime = 0;
      sessionStart = 0;
      self.postMessage({ type: 'tick', time: 0 });
      break;

    case 'set_time':
      totalTime = payload.totalTime ?? 0;
      if (!isActive) {
        sessionStart = Date.now();
      }
      self.postMessage({ type: 'tick', time: totalTime });
      break;
  }
};

export {};
