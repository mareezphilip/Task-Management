import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';

describe('DashboardSidebarComponent', () => {
  let fixture: ComponentFixture<DashboardSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSidebarComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardSidebarComponent);
    fixture.detectChanges();
  });

  it('creates the navigation sidebar', () => {
    expect(fixture.nativeElement.querySelector('aside nav')).toBeTruthy();
  });
});
