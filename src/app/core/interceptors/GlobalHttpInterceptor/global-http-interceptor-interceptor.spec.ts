import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GlobalErrorHandler } from '../../services/globalErrorHandler/global-error-handler';
import { LoadingService } from '../../services/loading-service/loading.service';
import { globalHttpInterceptorInterceptor } from './global-http-interceptor-interceptor';

describe('globalHttpInterceptorInterceptor', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([globalHttpInterceptorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: GlobalErrorHandler,
          useValue: { handleError: jasmine.createSpy('handleError') },
        },
      ],
    });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('tracks concurrent requests in the global loading state', () => {
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    const loading = TestBed.inject(LoadingService);
    client.get('/background').subscribe();
    expect(loading.isLoading()).toBeTrue();
    client.get('/tasks').subscribe();
    expect(loading.isLoading()).toBeTrue();
    http.expectOne('/background').flush({});
    expect(loading.isLoading()).toBeTrue();
    http.expectOne('/tasks').flush({});
    expect(loading.isLoading()).toBeFalse();
    // Background completion must not decrement the counter below zero.
    client.get('/tasks-again').subscribe();
    expect(loading.isLoading()).toBeTrue();
    http.expectOne('/tasks-again').flush({});
    expect(loading.isLoading()).toBeFalse();
  });

  it('stops loading after reporting a request failure', () => {
    const client = TestBed.inject(HttpClient);
    client.get('/background').subscribe();
    expect(TestBed.inject(LoadingService).isLoading()).toBeTrue();
    TestBed.inject(HttpTestingController)
      .expectOne('/background')
      .flush(null, { status: 502, statusText: 'Bad Gateway' });
    expect(TestBed.inject(LoadingService).isLoading()).toBeFalse();
    expect(TestBed.inject(GlobalErrorHandler).handleError).toHaveBeenCalledTimes(1);
  });
});
