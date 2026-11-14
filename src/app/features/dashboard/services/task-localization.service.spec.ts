import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';

import { globalHttpInterceptorInterceptor } from '../../../core/interceptors/GlobalHttpInterceptor/global-http-interceptor-interceptor';
import { GlobalErrorHandler } from '../../../core/services/globalErrorHandler/global-error-handler';
import { LoadingService } from '../../../core/services/loading-service/loading.service';
import { I18nService, Language } from '../../../core/services/i18n/i18n.service';
import { DashboardDataService } from './dashboard-data.service';
import { TaskLocalizationService } from './task-localization.service';

describe('TaskLocalizationService', () => {
  const language = signal<Language>('en');
  const tasks = signal<{ title: string; description: string }[]>([]);
  let service: TaskLocalizationService;
  let http: HttpTestingController;

  beforeEach(() => {
    language.set('en');
    tasks.set([{ title: 'New task', description: 'Task description' }]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([globalHttpInterceptorInterceptor])),
        {
          provide: GlobalErrorHandler,
          useValue: { handleError: jasmine.createSpy('handleError') },
        },
        provideHttpClientTesting(),
        { provide: I18nService, useValue: { language } },
        { provide: DashboardDataService, useValue: { tasks } },
      ],
    });
    service = TestBed.inject(TaskLocalizationService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });

  afterEach(() => http.verify());

  it('translates arbitrary content, new tasks and edits while sharing cached text', () => {
    expect(service.translate('New task')).toBe('New task');
    http.expectNone('/api/translations');
    language.set('ar');
    TestBed.tick();
    const request = http.expectOne('/api/translations');
    expect(TestBed.inject(LoadingService).isLoading()).toBeFalse();
    expect(request.request.body).toEqual({ texts: ['New task', 'Task description'], target: 'ar' });
    expect(service.translate('New task')).toBe('New task');
    request.flush({ translations: ['مهمة جديدة', 'وصف المهمة'] });
    expect(service.translate('New task')).toBe('مهمة جديدة');

    tasks.update((current) => [
      ...current,
      { title: 'Another task', description: 'Task description' },
    ]);
    TestBed.tick();
    const created = http.expectOne('/api/translations');
    expect(created.request.body.texts).toEqual(['Another task']);
    created.flush({ translations: ['مهمة أخرى'] });

    tasks.update((current) => [{ ...current[0], title: 'Edited task' }, current[1]]);
    TestBed.tick();
    const edited = http.expectOne('/api/translations');
    expect(edited.request.body.texts).toEqual(['Edited task']);
    edited.flush({ translations: ['مهمة معدلة'] });
    expect(service.translate('Edited task')).toBe('مهمة معدلة');

    language.set('en');
    TestBed.tick();
    expect(service.translate('Edited task')).toBe('Edited task');
    language.set('ar');
    TestBed.tick();
    expect(service.translate('Edited task')).toBe('مهمة معدلة');
    http.expectNone('/api/translations');
  });

  it('deduplicates pending texts and safely handles language changes during requests', () => {
    language.set('ar');
    TestBed.tick();
    const request = http.expectOne('/api/translations');
    tasks.update((current) => [...current]);
    TestBed.tick();
    http.expectNone('/api/translations');
    language.set('en');
    TestBed.tick();
    request.flush({ translations: ['مهمة جديدة', 'وصف المهمة'] });
    expect(service.translate('New task')).toBe('New task');
  });

  it('preserves source text on failure and retries on the next language change', () => {
    language.set('ar');
    TestBed.tick();
    http.expectOne('/api/translations').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.translate('New task')).toBe('New task');
    language.set('en');
    TestBed.tick();
    language.set('ar');
    TestBed.tick();
    http.expectOne('/api/translations').flush({ translations: ['مهمة جديدة', 'وصف المهمة'] });
    expect(service.translate('New task')).toBe('مهمة جديدة');
  });
});
