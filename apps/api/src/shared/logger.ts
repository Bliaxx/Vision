import pino, { type Logger } from 'pino';

export type { Logger };

export function createLogger(level: string, pretty: boolean): Logger {
  return pino({
    level,
    base: { service: 'dedale-api' },
    redact: {
      paths: ['req.headers.cookie', 'req.headers.authorization', '*.password', '*.token'],
      censor: '[masqué]',
    },
    ...(pretty ? { transport: { target: 'pino-pretty', options: { colorize: true } } } : {}),
  });
}
