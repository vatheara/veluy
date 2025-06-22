export type ClassListMerger = (
    ...classes: (string | null | undefined | false)[]
  ) => string;