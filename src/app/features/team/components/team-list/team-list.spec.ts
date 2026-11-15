import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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
        {
          provide: TeamDataService,
          useValue: { membersResource: { value: signal({ members: [] }) } },
        },
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
