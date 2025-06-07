import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import type * as S from "effect/Schema";

import type {
  ExpandedRouteConfig,
  FileSize,
  InvalidFileSizeError,
  InvalidFileTypeError,
  UnknownFileTypeError,
} from "@veluy/shared";
import {
  InvalidRouteConfigError,
  objectKeys,
  UploadThingError,
} from "@veluy/shared";

import type { FileRouter } from "../types";
import type { UploadActionPayload } from "./shared-schemas";
