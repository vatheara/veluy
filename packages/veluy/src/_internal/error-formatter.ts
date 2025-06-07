import type { VeluyError } from "@veluy/shared";

import type { FileRouter, inferErrorShape } from "../types";

export function defaultErrorFormatter(error: VeluyError) {
  return {
    message: error.message,
  };
}

export function formatError(
  error: VeluyError,
  router: FileRouter,
): inferErrorShape<FileRouter[string]> {
  const firstSlug = Object.keys(router)[0];
  const errorFormatter = firstSlug
    ? (router[firstSlug]?.errorFormatter ?? defaultErrorFormatter)
    : defaultErrorFormatter;

  return errorFormatter(error);
}
