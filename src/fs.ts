import { type AxiosResponse } from 'axios';
import { emptyDir, outputJson, readJson, remove } from 'fs-extra';
import { deburr } from 'lodash';
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
      return cacheResult as Promise<AxiosResponse<T, unknown>>;
    })
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') return Promise.resolve(undefined);

      return Promise.reject(
        new Error(`Error reading cache file: ${filePath}`, { cause: err })
      );
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
