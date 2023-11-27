import {
  type AxiosHeaderValue,
  type AxiosResponse,
  type AxiosResponseHeaders,
  type RawAxiosResponseHeaders,
} from 'axios';
import { isString } from 'lodash';

const getHeaderValue = (
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
  key: string
): string | undefined => {
  if (!(key in headers)) return undefined;
  const val = headers[key] as AxiosHeaderValue;

  return isString(val) ? val : undefined;
};

export const isCacheExpired = <T>(cachedResponse: AxiosResponse<T>) => {
  const expiresHeader = getHeaderValue(cachedResponse.headers, 'expires');
  const now = new Date();
  const expiresDate = new Date(expiresHeader ?? 0);
  return now < expiresDate;
};

export const isCacheFresh = <T>(
  cachedResponse: AxiosResponse<T>,
  remoteResponse: AxiosResponse<T>
): boolean => {
  const cachedHeader = getHeaderValue(cachedResponse.headers, 'last-modified');
  const remoteHeader = getHeaderValue(remoteResponse.headers, 'last-modified');

  const cachedDate = new Date(cachedHeader ?? 0);
  const remoteDate = new Date(remoteHeader ?? 0);

  return cachedDate >= remoteDate;
};
