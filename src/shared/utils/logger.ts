// src/shared/utils/logger.ts
interface LogLevel {
  ERROR: 0
  WARN: 1
  INFO: 2
  DEBUG: 3
}

interface LogEntry {
  timestamp: string
  level: keyof LogLevel
  context: string
  message: string
  data?: any
  userId?: string
  sessionId?: string
}

export class Logger {
  private static readonly levels: LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  }

  private static readonly currentLevel: keyof LogLevel = 
    (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG') as keyof LogLevel

  constructor(private readonly context: string) {}

  error(message: string, data?: any): void {
    this.log('ERROR', message, data)
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data)
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data)
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data)
  }

  private log(level: keyof LogLevel, message: string, data?: any): void {
    if (Logger.levels[level] > Logger.levels[Logger.currentLevel]) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    }

    // Console output
    this.logToConsole(entry)

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(entry)
    }

    // Store critical errors
    if (level === 'ERROR') {
      this.storeError(entry)
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, context, message, data } = entry

    const logMethod = {
      ERROR: console.error,
      WARN: console.warn,
      INFO: console.info,
      DEBUG: console.debug
    }[level]

    const logLine = `[${timestamp}] ${level} [${context}] ${message}`

    if (data) {
      logMethod(logLine, data)
    } else {
      logMethod(logLine)
    }
  }

  private async sendToLogService(entry: LogEntry): Promise<void> {
    try {
      // Send to external logging service (e.g., Sentry, LogRocket, etc.)
      // Implementation depends on the chosen service
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error)
    }
  }

  private storeError(entry: LogEntry): void {
    try {
      // Store in browser's local storage for debugging
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      errors.push(entry)
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift()
      }
      
      localStorage.setItem('app_errors', JSON.stringify(errors))
    } catch (error) {
      console.error('Failed to store error locally:', error)
    }
  }

  private getCurrentUserId(): string | undefined {
    // Implementation depends on your auth system
    return undefined
  }

  private getSessionId(): string | undefined {
    // Implementation depends on your session management
    return undefined
  }
}
