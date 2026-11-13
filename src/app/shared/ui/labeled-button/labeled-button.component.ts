import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-labeled-button',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './labeled-button.component.html',
  styleUrl: './labeled-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabeledButtonComponent {
  readonly image = input.required<string>();
  readonly label = input.required<string>();
  readonly route = input<string | null>(null);
}
