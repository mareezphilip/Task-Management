import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { type Assignee } from '../../models/assignee.model';
import { TeamDataService } from '../../services/TeamDataService/team-data.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamList implements OnInit {
  private readonly teamData = inject(TeamDataService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly search = signal('');
  private readonly allMembers = signal<Assignee[]>([]);
  protected readonly members = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.allMembers().filter((member) =>
      `${member.name} ${member.email}`.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.teamData
      .getMembers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.allMembers.set(response.members);
      });
  }

  nameFormat(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
