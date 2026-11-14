import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { response: HttpResponse<unknown>; expiresAt: number }>();

// Cache task and statistics GET responses for five minutes. Task queries use their full URL
export const httpCacheInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith('/api/');
  const isCacheableEndpoint = request.url === '/api/tasks' || request.url === '/api/statistics';
  const isTranslationRequest = request.url === '/api/translations';

  if (isApiRequest && request.method !== 'GET' && !isTranslationRequest) {
    responseCache.clear();
  }

  if (!isCacheableEndpoint || request.method !== 'GET') return next(request);

  const cacheKey = request.urlWithParams;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return of(cached.response.clone());
  if (cached) responseCache.delete(cacheKey);

  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        responseCache.set(cacheKey, {
          response: event.clone(),
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
      }
    }),
  );
};
