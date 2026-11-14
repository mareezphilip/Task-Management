import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabeledButtonComponent } from './labeled-button.component';

describe('LabeledButtonComponent', () => {
  let fixture: ComponentFixture<LabeledButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabeledButtonComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(LabeledButtonComponent);
    fixture.componentRef.setInput('image', '/assets/icon.svg');
    fixture.componentRef.setInput('label', 'Dashboard');
    fixture.detectChanges();
  });

  it('renders the supplied image and label', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const image: HTMLImageElement = fixture.nativeElement.querySelector('img');

    expect(button.textContent).toContain('Dashboard');
    expect(image.getAttribute('src')).toBe('/assets/icon.svg');
  });
});
