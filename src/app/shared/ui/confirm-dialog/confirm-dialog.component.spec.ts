import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent, boolean>>;

  const data: ConfirmDialogData = {
    title: 'Delete task?',
    message: 'This task will be permanently deleted.',
    danger: true,
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<ConfirmDialogComponent, boolean>>(
      'MatDialogRef',
      ['close'],
    );
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  });

  it('renders the title, message, and default button labels', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h2')?.textContent).toContain('Delete task?');
    expect(element.querySelector('mat-dialog-content')?.textContent).toContain(data.message);
    expect(element.querySelector('.cancel-button')?.textContent).toContain('No');
    expect(element.querySelector('.confirm-button')?.textContent).toContain('Yes');
    expect(element.querySelector('.confirm-button')?.classList).toContain('danger-button');
  });

  it('closes with false when the cancel button is clicked', () => {
    fixture.nativeElement.querySelector('.cancel-button').click();

    expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
  });

  it('closes with true when the confirm button is clicked', () => {
    fixture.nativeElement.querySelector('.confirm-button').click();

    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
  });
});
