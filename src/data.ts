import { type AxiosResponse } from 'axios';
import { remove } from 'fs-extra';
import { isNil } from 'lodash';
import { withConfig, type IPackageConfig } from './config';
import {
  cacheGet,
  getCacheFilePath,
  isCacheExpired,
  isCacheFresh,
} from './utils/cache';
import { requestRemote, requestRemoteMeta } from './utils/net';

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
    requestRemoteMeta<ResponseData, RequestData>(slug, config),
  ]).then((results) => {
    const [cachedResponse, headResponse] = results;

    if (
      !isNil(cachedResponse) &&
      !isCacheExpired(cachedResponse) &&
      isCacheFresh(cachedResponse, headResponse)
    ) {
      return Promise.resolve(cachedResponse);
    }

    return remove(filePath).then(() =>
      requestRemote<ResponseData, RequestData>(slug, config)
    );
  });
};
