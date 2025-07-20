import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as S from "effect/Schema";

import { filterDefinedObjectValues, VeluyError } from "@veluy/shared";

import { UploadThingToken } from "./shared-schemas";

export { version as VELUY_VERSION } from "../../package.json";

/**
 * Merge in `import.meta.env` to the built-in `process.env` provider
 * Prefix keys with `VELUY_` so we can reference just the name.
 * @example
 * process.env.VELUY_TOKEN = "foo"
 * Config.string("token"); // Config<"foo">
 */
const envProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromMap(
      new Map(
        Object.entries(
          filterDefinedObjectValues(
            // fuck this I give up. import.meta is a mistake, someone else can fix it
            (
              import.meta as unknown as
                | { env: Record<string, string> }
                | undefined
            )?.env ?? {},
          ),
        ),
      ),
      {
        pathDelim: "_",
      },
    ),
  ),
  ConfigProvider.nested("veluy"),
  ConfigProvider.constantCase,
);

/**
 * Config provider that merges the options from the object
 * and environment variables prefixed with `UPLOADTHING_`.
 * @remarks Options take precedence over environment variables.
 */
export const configProvider = (options: unknown) =>
  ConfigProvider.fromJson(options ?? {}).pipe(
    ConfigProvider.orElse(() => envProvider),
  );

export const IsDevelopment = Config.boolean("isDev").pipe(
  Config.orElse(() =>
    Config.succeed(
      typeof process !== "undefined" ? process.env.NODE_ENV : undefined,
    ).pipe(Config.map((_) => _ === "development")),
  ),
  Config.withDefault(false),
);

export const BKToken = S.Config("token", UploadThingToken).pipe(
  Effect.catchTags({
    ConfigError: (e) =>
      new VeluyError({
        code: e._op === "InvalidData" ? "INVALID_SERVER_CONFIG" : "MISSING_ENV",
        message:
          e._op === "InvalidData"
            ? "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }."
            : "Missing token. Please set the `BAKONG_API_TOKEN` environment variable or provide a token manually through config.",
        cause: e,
      }),
  }),
);

export const ApiUrl = Config.string("apiUrl").pipe(
  Config.withDefault("https://api-bakong.nbc.gov.kh"),
  Config.mapAttempt((_) => new URL(_)),
  Config.map((url) => url.href.replace(/\/$/, "")),
);
