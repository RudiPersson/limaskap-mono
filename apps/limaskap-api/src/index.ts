import { serve } from "@hono/node-server";

import app from "@/app";
import env from "@/env";

const port = env.PORT;

// Timeout constants
const GRACEFUL_SHUTDOWN_TIMEOUT = 1000; // 1 second
const DEV_RESTART_TIMEOUT = 100; // 100ms

let server: ReturnType<typeof serve> | undefined;

try {
  server = serve({
    fetch: app.fetch,
    port,
  });
  
  // Handle server errors (like port already in use)
  server.on('error', (error: Error & { code?: string }) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Please kill the existing process or use a different port.`);
      process.exit(1);
    }
    console.error('Server error:', error);
    process.exit(1);
  });
  
  // eslint-disable-next-line no-console
  console.log(`Server is running on port http://localhost:${port}`);
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use. Please kill the existing process or use a different port.`);
    process.exit(1);
  }
  throw error;
}

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`\n🛑 Received ${signal}. Shutting down server gracefully...`);
  
  if (server) {
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ No server to close, exiting...');
    process.exit(0);
  }
  
  // Shorter timeout for development tools
  setTimeout(() => {
    // eslint-disable-next-line no-console
    console.log('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT);
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Termination signal

// For tsx/nodemon compatibility - exit immediately on SIGUSR2
process.on('SIGUSR2', () => {
  // eslint-disable-next-line no-console
  console.log('\n🔄 Received SIGUSR2. Restarting...');
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  // Force exit quickly for development restarts
  setTimeout(() => process.exit(0), DEV_RESTART_TIMEOUT);
});