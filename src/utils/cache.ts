import { type AxiosResponse } from 'axios';
import { outputJson, readJson, remove } from 'fs-extra';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { makeSafePath } from './fs';
import { getHeaderValue } from './net';

export const getDefaultCacheDirectory = () =>
  path.join(tmpdir(), `cache-cms-data-sync`);

export const getCacheFilePath = (cacheDirectory: string, slug: string) => {
  const safePath = makeSafePath(slug);
  const filePath = path.join(cacheDirectory, `${safePath}.response.json`);

  return filePath;
};

export const cacheDelete = async (filePath: string) => remove(filePath);

export const cachePut = async <T>(
  filePath: string,
  response: AxiosResponse<T>
) => {
  const { data, headers } = response;
  return outputJson(filePath, { data, headers });
};

export const cacheGet = async <T>(
  filePath: string
): Promise<AxiosResponse<T, unknown> | undefined> => {
  return readJson(filePath, { throws: false })
    .then((cacheResult) => {
      return cacheResult as Promise<AxiosResponse<T, unknown>>;
    })
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') return Promise.resolve(undefined);

      return Promise.reject(
        new Error(`Error reading cache file: ${filePath}`, { cause: err })
      );
    });
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
