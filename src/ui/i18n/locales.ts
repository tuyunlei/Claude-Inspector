import { general } from './modules/general';
import { dashboard } from './modules/dashboard';
import { sessions } from './modules/sessions';
import { structure } from './modules/structure';

export const translations = {
  en: {
    ...general.en,
    ...dashboard.en,
    ...sessions.en,
    ...structure.en,
  },
  zh: {
    ...general.zh,
    ...dashboard.zh,
    ...sessions.zh,
    ...structure.zh,
  }
};