import { generalCommon } from './general/common';
import { generalUi } from './general/ui';

export const general = {
  en: {
    ...generalCommon.en,
    ...generalUi.en
  },
  zh: {
    ...generalCommon.zh,
    ...generalUi.zh
  }
};