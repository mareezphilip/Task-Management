import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

import { globalHttpInterceptorInterceptor } from './global-http-interceptor-interceptor';

describe('globalHttpInterceptorInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => globalHttpInterceptorInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
