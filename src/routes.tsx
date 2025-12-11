import WorkHoursTracker from './pages/WorkHoursTracker';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '工时统计',
    path: '/',
    element: <WorkHoursTracker />
  }
];

export default routes;
