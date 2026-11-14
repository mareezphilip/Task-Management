import { Pipe, PipeTransform, inject } from '@angular/core';

import { I18nService } from '../services/i18n/i18n.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, parameters?: Record<string, string | number | undefined>): string {
    let translation = this.i18n.translate(key);

    for (const [name, value] of Object.entries(parameters ?? {})) {
      translation = translation.replaceAll(`{${name}}`, String(value));
    }

    return translation;
  }
}
