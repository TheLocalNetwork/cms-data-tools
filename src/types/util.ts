export type TDataGovUUID = string;
export type TDataGovURI = string;
export type TDataGovURIorJSON = string | object;
export type TDataGovEpochDate = number;
export type TDataGovISODate = string;
export type TDataGovISODuration = string;
export type TDataGovTemporal = string;
export type TDataGovMimeType = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObject = Record<string, any>;
export type UnknownObject = Record<string, unknown>;
export type EmptyObject = Record<string, never>;
export type TypedObject<T> = Record<string, T>;

export type Keys<T> = keyof T;
export type Values<T> = T[Keys<T>];
