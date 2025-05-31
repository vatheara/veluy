export type JsonValue = string | number | boolean | null | undefined;
export type JsonObject = { [key: string]: JsonValue | JsonObject | JsonArray };
export type JsonArray = (JsonValue | JsonObject)[];
export type Json = JsonValue | JsonObject | JsonArray;

export type Overwrite<T, U> = Omit<T, keyof U> & U;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type ErrorMessage<TError extends string> = TError;
export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};
export type MaybePromise<TType> = TType | Promise<TType>;
export type Either<TData, TError> =
  | { data: TData; error: null }
  | { data: null; error: TError };
export type ExtendObjectIf<Predicate, ToAdd> = undefined extends Predicate
  ? {}
  : ToAdd;
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
