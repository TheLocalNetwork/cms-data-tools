import { type AxiosResponse } from 'axios';
import { remove } from 'fs-extra';
import { isNil } from 'lodash';
import { cacheGet, getCacheFilePath } from './cache';
import { withConfig, type IPackageConfig } from './config';
import { requestRemote, requestRemoteHead } from './net';
import { type IDataGovCatalog } from './types';
import { isCacheExpired, isCacheFresh } from './utils';

export const retrieveData = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<ResponseData>> => {
  const { cache } = withConfig(config);

  if (!cache.enableLocalCache) {
    return requestRemote<ResponseData, RequestData>(slug, config);
  }

  const filePath = getCacheFilePath(cache.cacheDirectory, slug);
  return retrieveCachableData<ResponseData, RequestData>(
    filePath,
    slug,
    config
  );
};

export const retrieveCachableData = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  filePath: string,
  slug: string,
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<ResponseData, RequestData>> => {
  return Promise.all([
    cacheGet<ResponseData>(filePath),
    requestRemoteHead<ResponseData, RequestData>(slug, config),
  ]).then((results) => {
    const [cachedResponse, headResponse] = results;

    if (
      !isNil(cachedResponse) &&
      !isCacheExpired(cachedResponse) &&
      isCacheFresh(cachedResponse, headResponse)
    ) {
      console.info(`cms-data-tools`, `cache is still valid`, { slug });
      return Promise.resolve(cachedResponse);
    }

    console.info(`cms-data-tools`, `cache is outdated`, { slug });
    return remove(filePath).then(() =>
      requestRemote<ResponseData, RequestData>(slug, config)
    );
  });
};

export const getDataCatalogResponse = async (
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<IDataGovCatalog>> => {
  return retrieveData<IDataGovCatalog, never>(`data.json`, config);
};

export const getDataCatalog = async (
  config: Partial<IPackageConfig> = {}
): Promise<IDataGovCatalog> => {
  return getDataCatalogResponse(config).then(({ data }) => data);
};
