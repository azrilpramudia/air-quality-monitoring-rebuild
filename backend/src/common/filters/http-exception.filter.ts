import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Shape error response yang konsisten untuk semua endpoint.
 *
 * Contoh output saat 404:
 * {
 *   "success": false,
 *   "statusCode": 404,
 *   "error": "Not Found",
 *   "message": "Reading with id 999 not found",
 *   "path": "/api/v1/sensors/readings/999",
 *   "timestamp": "2026-03-31T08:33:00.000Z"
 * }
 *
 * Contoh output saat validasi gagal (400):
 * {
 *   "success": false,
 *   "statusCode": 400,
 *   "error": "Bad Request",
 *   "message": ["limit must not be less than 1", "from must be a valid ISO 8601 date string"],
 *   "path": "/api/v1/sensors/readings",
 *   "timestamp": "2026-03-31T08:33:00.000Z"
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ── Tentukan status code ─────────────────
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // ── Ekstrak pesan error ──────────────────
    let message: string | string[] = 'Internal server error';
    let errorName = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      errorName = exception.name;

      if (typeof exceptionResponse === 'string') {
        // Exception sederhana: throw new NotFoundException('not found')
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, unknown>;
        // ValidationPipe menghasilkan array pesan di field 'message'
        message = (res.message as string | string[]) ?? exception.message;
        errorName = (res.error as string) ?? errorName;
      }
    } else if (exception instanceof Error) {
      // Error JS biasa yang tidak ditangani (bug tak terduga)
      message = 'An unexpected error occurred';
      // Log full stack hanya untuk error non-HTTP agar tidak spam di log normal
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    // Log semua error 5xx sebagai error, 4xx sebagai warn
    if (status >= 500) {
      this.logger.error(
        `[${status}] ${request.method} ${request.url} — ${message}`,
      );
    } else {
      this.logger.warn(
        `[${status}] ${request.method} ${request.url} — ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorName,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
