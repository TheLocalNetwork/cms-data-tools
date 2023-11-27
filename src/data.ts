import { type AxiosRequestConfig, type AxiosResponse } from 'axios';
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
  options?: {
    packageConfig?: Partial<IPackageConfig>;
    requestConfig?: AxiosRequestConfig;
  }
): Promise<AxiosResponse<ResponseData>> => {
  const fnConfig = withConfig(options?.packageConfig);
  if (!fnConfig.enableLocalCache) {
    return requestRemote<ResponseData, RequestData>(slug, options);
  }

  const filePath = getFilePath(fnConfig.cacheDirectory, slug);
  return retrieveCachableData<ResponseData, RequestData>(
    filePath,
    slug,
    options
  );
};

export const retrieveCachableData = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  filePath: string,
  slug: string,
  options?: {
    packageConfig?: Partial<IPackageConfig>;
    requestConfig?: AxiosRequestConfig;
  }
): Promise<AxiosResponse<ResponseData, RequestData>> => {
  return getFromCache<ResponseData>(filePath).then((cachedResponse) => {
    if (isNil(cachedResponse) || isCacheExpired(cachedResponse)) {
      return remove(filePath).then(() =>
        requestRemote<ResponseData, RequestData>(slug, options)
      );
    }

    return requestRemoteHead<ResponseData, RequestData>(
      slug,
      options?.requestConfig
    ).then((headResponse) => {
      if (isCacheFresh(cachedResponse, headResponse)) return cachedResponse;
      return requestRemote<ResponseData, RequestData>(slug, options);
    });
  });
};

export const getDataCatalogResponse = async (options?: {
  packageConfig?: Partial<IPackageConfig>;
  requestConfig?: AxiosRequestConfig;
}): Promise<AxiosResponse<IDataGovCatalog>> => {
  return retrieveData<IDataGovCatalog, never>(`data.json`, options);
};

export const getDataCatalog = async (options?: {
  packageConfig?: Partial<IPackageConfig>;
  requestConfig?: AxiosRequestConfig;
}): Promise<IDataGovCatalog> => {
  return getDataCatalogResponse(options).then(({ data }) => data);
};
