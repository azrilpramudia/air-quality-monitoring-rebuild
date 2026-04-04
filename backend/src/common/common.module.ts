import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

/**
 * @Global() — module ini tidak perlu di-import satu per satu
 * di setiap module. Cukup di-import sekali di AppModule,
 * filter dan interceptor langsung berlaku di seluruh aplikasi.
 */
@Global()
@Module({
  providers: [
    // Tangkap semua HTTP exception dan format jadi response konsisten
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Wrap semua response sukses dengan envelope { success, data, timestamp }
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [],
})
export class CommonModule {}
