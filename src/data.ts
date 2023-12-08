import { type AxiosResponse } from 'axios';
import { remove } from 'fs-extra';
import { isNil } from 'lodash';
import { withConfig, type IPackageConfig } from './config';
import { getFilePath, getFromCache } from './fs';
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
  const fnConfig = withConfig(config);

  if (!fnConfig.cache.enableLocalCache) {
    return requestRemote<ResponseData, RequestData>(slug, config);
  }

  const filePath = getFilePath(fnConfig.cache.cacheDirectory, slug);
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
  const fnConfig = withConfig(config);

  return getFromCache<ResponseData>(filePath).then((cachedResponse) => {
    if (isNil(cachedResponse) || isCacheExpired(cachedResponse)) {
      return remove(filePath).then(() =>
        requestRemote<ResponseData, RequestData>(slug, fnConfig)
      );
    }

    return requestRemoteHead<ResponseData, RequestData>(slug, config).then(
      (headResponse) => {
        if (isCacheFresh(cachedResponse, headResponse)) return cachedResponse;
        return requestRemote<ResponseData, RequestData>(slug, config);
      }
    );
  });
};

export const getDataCatalogResponse = async (
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<IDataGovCatalog>> => {
  const fnConfig = withConfig(config);

  return retrieveData<IDataGovCatalog, never>(`data.json`, fnConfig);
};

export const getDataCatalog = async (
  config: Partial<IPackageConfig> = {}
): Promise<IDataGovCatalog> => {
  const fnConfig = withConfig(config);

  return getDataCatalogResponse(fnConfig).then(({ data }) => data);
};
