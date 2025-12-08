import { dashboardUi } from './dashboard/ui';
import { dashboardData } from './dashboard/data';

export const dashboard = {
  en: {
    ...dashboardUi.en,
    ...dashboardData.en
  },
  zh: {
    ...dashboardUi.zh,
    ...dashboardData.zh
  }
};