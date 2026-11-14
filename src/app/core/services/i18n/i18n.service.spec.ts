import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  it('switches labels and page direction synchronously without fetching dictionaries', () => {
    const root = { lang: 'en', dir: 'ltr' };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: DOCUMENT,
          useValue: {
            documentElement: root,
            defaultView: { localStorage: { getItem: () => null, setItem: () => undefined } },
          },
        },
      ],
    });
    const fetchSpy = spyOn(globalThis, 'fetch');
    const service = TestBed.inject(I18nService);
    const english = service.translate('task.new');
    service.setLanguage('ar');
    expect(root).toEqual({ lang: 'ar', dir: 'rtl' });
    expect(service.translate('task.new')).not.toBe(english);
    expect(service.translate('task.new')).not.toBe('task.new');
    service.setLanguage('en');
    expect(root).toEqual({ lang: 'en', dir: 'ltr' });
    expect(service.translate('task.new')).toBe(english);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
