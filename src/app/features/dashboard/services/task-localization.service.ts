import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { finalize } from 'rxjs';

import { I18nService } from '../../../core/services/i18n/i18n.service';
import { DashboardDataService } from './dashboard-data.service';

@Injectable({ providedIn: 'root' })
export class TaskLocalizationService {
  private readonly i18n = inject(I18nService);
  private readonly dashboardData = inject(DashboardDataService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translations = signal<ReadonlyMap<string, string>>(new Map());
  private readonly pending = new Set<string>();

  constructor() {
    effect(() => {
      const language = this.i18n.language();
      const tasks = this.dashboardData.tasks();
      if (language !== 'ar') return;

      untracked(() => {
        const texts = [...new Set(tasks.flatMap((task) => [task.title, task.description]))].filter(
          (text) => text.trim() && !this.translations().has(text) && !this.pending.has(text),
        );
        // Batch requests and share results between the board and activity feed.
        for (let index = 0; index < texts.length; index += 50) {
          const batch = texts.slice(index, index + 50);
          batch.forEach((text) => this.pending.add(text));
          this.http
            .post<{ translations: string[] }>('/api/translations', {
              texts: batch,
              target: language,
            })
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              finalize(() => batch.forEach((text) => this.pending.delete(text))),
            )
            .subscribe({
              next: ({ translations }) => {
                this.translations.update(
                  (current) =>
                    new Map([
                      ...current,
                      ...batch.map((text, index): [string, string] => [text, translations[index]]),
                    ]),
                );
              },
            });
        }
      });
    });
  }

  translate(text: string): string {
    return this.i18n.language() === 'ar' ? (this.translations().get(text) ?? text) : text;
  }
}
