import { type AxiosResponse } from 'axios';
import { isString } from 'lodash';

const getHeaderValue = <T>(
  headers: AxiosResponse<T>['headers'],
  key: string
) => {
  return isString(headers[key]) ? (headers[key] as string) : undefined;
};

export const isCacheExpired = <T>(cachedResponse: AxiosResponse<T>) => {
  const expiresHeader = getHeaderValue(cachedResponse.headers, 'expires');
  const now = new Date();
  const expiresDate = new Date(expiresHeader ?? 0);
  return now < expiresDate;
};

export const isCacheOutOfDate = <T>(
  cachedResponse: AxiosResponse<T>,
  remoteResponse: AxiosResponse<T>
) => {
  const cachedLastModifiedHeader = getHeaderValue(
    cachedResponse.headers,
    'last-modified'
  );
  const remoteLastModifiedHeader = getHeaderValue(
    remoteResponse.headers,
    'last-modified'
  );
  const cachedLastModifiedDate = new Date(cachedLastModifiedHeader ?? 0);
  const remoteLastModifiedDate = new Date(remoteLastModifiedHeader ?? 0);

  return remoteLastModifiedDate > cachedLastModifiedDate;
};
