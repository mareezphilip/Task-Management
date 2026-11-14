import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import english from '../../../../../public/assets/i18n/en.json';
import arabic from '../../../../../public/assets/i18n/ar.json';

export type Language = 'en' | 'ar';
type TranslationDictionary = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly dictionaries: Record<Language, TranslationDictionary> = {
    en: english,
    ar: arabic,
  };

  readonly language = signal<Language>(this.readSavedLanguage());

  constructor() {
    this.applyLanguage();
  }

  translate(key: string, count?: number): string {
    const dictionary = this.dictionaries[this.language()];
    const translation = dictionary?.[key] || key;

    return count !== undefined ? translation.replace('{count}', String(count)) : translation;
  }

  toggleLanguage(): void {
    const newLanguage = this.language() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLanguage);
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    this.applyLanguage();

    this.document.defaultView?.localStorage.setItem('task-manager-language', language);
  }

  private readSavedLanguage(): Language {
    const savedLanguage = this.document.defaultView?.localStorage.getItem('task-manager-language');
    return savedLanguage === 'ar' ? 'ar' : 'en';
  }

  private applyLanguage(): void {
    const language = this.language();

    this.document.documentElement.lang = language;
    this.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }
}
