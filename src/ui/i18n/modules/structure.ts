import { structureUi } from './structure/ui';
import { structureKinds } from './structure/kinds';

export const structure = {
  en: {
    structure: {
      ...structureUi.en.structure,
      kinds: structureKinds.en
    }
  },
  zh: {
    structure: {
      ...structureUi.zh.structure,
      kinds: structureKinds.zh
    }
  }
};