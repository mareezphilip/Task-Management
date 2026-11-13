import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { globalHttpInterceptorInterceptor } from '../../../interceptors/GlobalHttpInterceptor/global-http-interceptor-interceptor';
import { GlobalErrorHandler } from '../global-error-handler';
import { LoadingService } from './loading.service';

describe('HTTP loading', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([globalHttpInterceptorInterceptor])),
        provideHttpClientTesting(),
        { provide: GlobalErrorHandler, useValue: { handleError: jasmine.createSpy('handleError') } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => http.verify());

  it('stays loading until all concurrent requests finish', () => {
    expect(loading.isLoading()).toBeFalse();
    client.get('/api/tasks').subscribe();
    client.get('/api/statistics').subscribe();
    expect(loading.isLoading()).toBeTrue();

    http.expectOne('/api/tasks').flush({ tasks: [] });
    expect(loading.isLoading()).toBeTrue();
    http.expectOne('/api/statistics').flush({ statistics: [] });
    expect(loading.isLoading()).toBeFalse();
  });

  it('clears loading after a failed request', () => {
    client.get('/api/tasks').subscribe();
    http.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Server Error' });
    expect(loading.isLoading()).toBeFalse();
    expect(TestBed.inject(GlobalErrorHandler).handleError).toHaveBeenCalledTimes(1);
  });

  it('clears loading when a request is cancelled', () => {
    const subscription = client.get('/api/tasks').subscribe();
    const request = http.expectOne('/api/tasks');
    expect(loading.isLoading()).toBeTrue();
    subscription.unsubscribe();
    expect(request.cancelled).toBeTrue();
    expect(loading.isLoading()).toBeFalse();
  });

  it('starts tracking only when a request is subscribed to', () => {
    const request = client.get('/api/tasks');
    expect(loading.isLoading()).toBeFalse();
    request.subscribe();
    http.expectOne('/api/tasks').flush({ tasks: [] });
    request.subscribe();
    expect(loading.isLoading()).toBeTrue();
    http.expectOne('/api/tasks').flush({ tasks: [] });
    expect(loading.isLoading()).toBeFalse();
  });
});
