import { type AxiosResponse } from 'axios';
import { emptyDir, outputJson, readJson } from 'fs-extra';
import { deburr } from 'lodash';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const writeToCache = async <T>(
  filePath: string,
  response: AxiosResponse<T>
) => {
  const { data, headers } = response;
  return outputJson(filePath, { data, headers });
};

export const readFromCache = async <T>(filePath: string) =>
  readJson(filePath) as Promise<AxiosResponse<T>>;

export const getDefaultCacheDirectory = () =>
  path.join(tmpdir(), `cache-cms-data-sync`);

export const pathSafeRegex = /[^a-z0-9]/g;
export const repeatDashRegex = /-+/g;

export const getFilePath = (cacheDirectory: string, slug: string) => {
  const safePath = makeSafePath(slug);
  const filePath = path.join(cacheDirectory, `${safePath}.response.json`);

  // console.info({ filePath });

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

export const cleanupCache = async (cacheDirectory: string) => {
  // console.info('cleaning up cache', { cacheDirectory });
  return emptyDir(cacheDirectory);
};
