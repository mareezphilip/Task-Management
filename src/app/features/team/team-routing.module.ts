import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayout } from '../../layout/main-layout/main-layout';
import { TeamList } from './components/team-list/team-list';

const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [{ path: '', component: TeamList }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamRoutingModule {}
