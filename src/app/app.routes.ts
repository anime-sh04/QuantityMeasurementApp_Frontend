import { Routes } from '@angular/router';
import { ConverterComponent } from './features/converter/converter.component';
import { HistoryComponent } from './features/history/history.component';

export const routes: Routes = [
  { path: '',        component: ConverterComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**',      redirectTo: '' }
];
