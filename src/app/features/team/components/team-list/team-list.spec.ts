import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TeamList } from './team-list';
import { TeamDataService } from '../../services/TeamDataService/team-data.service';

describe('TeamList', () => {
  let component: TeamList;
  let fixture: ComponentFixture<TeamList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamList],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TeamDataService, useValue: { getMembers: () => of({ members: [] }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
