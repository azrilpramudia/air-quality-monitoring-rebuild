import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Semua response sukses (2xx) di-wrap dengan envelope ini:
 *
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "data": { ...payload dari controller },
 *   "timestamp": "2026-03-31T08:33:00.000Z"
 * }
 *
 * Dengan ini, frontend selalu bisa expect shape yang sama
 * dan cukup akses response.data untuk mendapat payload.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  WrappedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<WrappedResponse<T>> {
    const statusCode = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// ─────────────────────────────────────────
//  Type helper untuk wrapped response
// ─────────────────────────────────────────
interface WrappedResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}
