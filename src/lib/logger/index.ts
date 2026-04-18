type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();

  console[level](`[${timestamp}] ${message}`, context ?? {});
}

export const logger = {
  error(message: string, context?: Record<string, unknown>) {
    write("error", message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    write("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    write("warn", message, context);
  },
};

