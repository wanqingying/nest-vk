import { INestApplication } from '@nestjs/common';
import { promisify } from 'node:util';
import axios from 'axios';

interface ShutdownOption {
  timeoutMs?: number; // default 8000ms
  // because there are actions after request completed
  // example: set some cache in redis non-blocking
  // so we just wait some time before shutting down
  wait?: number;
}

const prefix = '[GracefulShutdown]';
export function setupGracefulShutdown(
  app: INestApplication,
  option?: ShutdownOption,
): void {
  const TIMEOUT_MS = option?.timeoutMs || 8000;
  const wait = option?.wait || 50; // k8s force kill
  let isShuttingDown = false;
  const server = app.getHttpServer();
  console.log(`${prefix} Setting up graceful shutdown hook`);

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) {
      console.warn(
        `${prefix} Shutdown already in progress, received additional signal: ${signal}`,
      );
      return;
    }

    isShuttingDown = true;
    console.log(`${prefix} Graceful shutdown initiated by ${signal}`);

    const timer = setTimeout(() => {
      console.error(
        `${prefix} Force shutdown due to ${signal} timeout after ${TIMEOUT_MS}ms`,
      );
      process.exit(1);
    }, TIMEOUT_MS);

    try {
      axios
        .get('http://localhost:3007/api/health')
        .then((res) => {
          console.log(`${prefix} Health check response:`, res.data);
        })
        .catch((e) => {
          console.error(`${prefix} Health check failed:`, e.message);
        });
      await new Promise((resolve) => setTimeout(resolve, 200));
      console.log(`${prefix} Stopping server from accepting new connections`);
      const closeServer = promisify(server.close.bind(server));
      await closeServer();
      console.log(
        `${prefix} All connections closed, shutting down application`,
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
      await app.close();
      console.log(`${prefix} Application successfully closed on ${signal}`);

      clearTimeout(timer);
      console.log(
        `${prefix} Graceful shutdown completed, exiting process on ${signal}`,
      );
      process.exit(0);
    } catch (e) {
      console.error(
        `${prefix} Error during graceful shutdown on ${signal}:`,
        e,
      );
      clearTimeout(timer);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

  process.on('uncaughtException', (e) => {
    console.error(`${prefix} Uncaught Exception:`, e);
    gracefulShutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error(
      `${prefix} Unhandled Rejection at:`,
      promise,
      'reason:',
      reason,
    );
    gracefulShutdown('unhandledRejection');
  });
}
