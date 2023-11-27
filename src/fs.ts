import { type AxiosResponse } from 'axios';
import { emptyDir, outputJson, readJson, remove } from 'fs-extra';
import { deburr, isNil } from 'lodash';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const getDefaultCacheDirectory = () =>
  path.join(tmpdir(), `cache-cms-data-sync`);

export const writeToCache = async <T>(
  filePath: string,
  response: AxiosResponse<T>
) => {
  const { data, headers } = response;
  return outputJson(filePath, { data, headers });
};

export const getFromCache = async <T>(
  filePath: string
): Promise<AxiosResponse<T, unknown> | undefined> => {
  return readJson(filePath, { throws: false })
    .then((cacheResult) => {
      if (isNil(cacheResult)) return Promise.resolve(undefined);
      return cacheResult as Promise<AxiosResponse<T, unknown>>;
    })
    .catch((err: Error) => {
      if (err.message === 'ENOENT') return Promise.resolve(undefined);
      else return Promise.reject(err);
    });
};

export const removeFromCache = async (filePath: string) => remove(filePath);

export const pathSafeRegex = /[^a-z0-9]/g;
export const repeatDashRegex = /-+/g;

export const getFilePath = (cacheDirectory: string, slug: string) => {
  const safePath = makeSafePath(slug);
  const filePath = path.join(cacheDirectory, `${safePath}.response.json`);

  return filePath;
};

export const makeSafePath = (path: string) => {
  const chunks = path.split(/[/.?&]/g);
  const safePath = chunks.map(makeSafePathChunk).join('_');

  return safePath;
};

export const makeSafePathChunk = (slug: string) =>
  deburr(slug)
    .toLowerCase()
    .replace(pathSafeRegex, '-')
    .replace(repeatDashRegex, '-');

export const cleanupCache = async (cacheDirectory: string) =>
  emptyDir(cacheDirectory);
