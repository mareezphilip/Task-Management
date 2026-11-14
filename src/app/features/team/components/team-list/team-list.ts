import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TeamDataService } from '../../services/TeamDataService/team-data.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './team-list.html',
  styleUrl: './team-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamList {
  private readonly teamData = inject(TeamDataService);
  protected readonly search = signal('');
  private readonly allMembers = computed(
    () => this.teamData.membersResource.value()?.members ?? [],
  );
  protected readonly members = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.allMembers().filter((member) =>
      `${member.name} ${member.email}`.toLowerCase().includes(query),
    );
  });

  nameFormat(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
