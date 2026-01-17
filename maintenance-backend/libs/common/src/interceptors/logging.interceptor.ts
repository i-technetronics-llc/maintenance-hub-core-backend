import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Logging Interceptor
 * Logs all incoming requests and outgoing responses
 * Measures request duration
 *
 * Note: When using Pino logger (LoggerModule), this provides additional
 * application-level logging beyond HTTP logging
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(`Incoming Request: ${method} ${url} - ${userAgent}`);

    // Log request body if present (excluding sensitive data)
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = { ...body };
      // Remove sensitive fields from logs
      delete sanitizedBody.password;
      delete sanitizedBody.token;
      delete sanitizedBody.refreshToken;
      this.logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request Failed: ${method} ${url} - ${duration}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
