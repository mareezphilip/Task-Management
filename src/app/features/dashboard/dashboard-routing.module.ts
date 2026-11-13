import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { MainLayout } from '../../layout/main-layout/main-layout';

const routes: Routes = [{
  path: '',
  component: MainLayout,
  children: [{ path: '', component: DashboardComponent }],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
