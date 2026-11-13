import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-labeled-button',
  standalone: true,
  templateUrl: './labeled-button.component.html',
  styleUrl: './labeled-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabeledButtonComponent {
  readonly image = input.required<string>();
  readonly label = input.required<string>();
  readonly active = input(false);
}
