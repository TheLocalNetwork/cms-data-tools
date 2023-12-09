import axios, { type AxiosResponse } from 'axios';
import { cachePut, getCacheFilePath } from './cache';
import { withConfig, type IPackageConfig } from './config';
import { isCacheFresh } from './utils';

export const requestRemoteBare = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<ResponseData>> => {
  const { requestConfig } = withConfig(config);

  return axios.request<ResponseData, AxiosResponse<ResponseData>, RequestData>({
    url: slug,
    method: 'GET',
    ...requestConfig,
  });
};

export const requestRemoteMeta = <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  config: Partial<IPackageConfig> = {}
) => {
  return requestRemoteBare<ResponseData, RequestData>(slug, {
    ...config,
    requestConfig: {
      ...config.requestConfig,
      method: 'HEAD',
    },
  });
};

export const isRemoteNewer = async <ResponseData, RequestData>(
  slug: string,
  cachedResponse: AxiosResponse<ResponseData, RequestData>,
  config: Partial<IPackageConfig> = {}
) =>
  requestRemoteMeta<ResponseData, RequestData>(slug, config).then(
    (remoteResponse) => isCacheFresh(cachedResponse, remoteResponse)
  );

export const requestRemote = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<ResponseData>> => {
  const { cache } = withConfig(config);
  const filePath = getCacheFilePath(cache.cacheDirectory, slug);

  const handlePostRequest = (
    response: AxiosResponse<ResponseData>
  ): Promise<AxiosResponse<ResponseData>> =>
    (cache.enableLocalCache
      ? cachePut<ResponseData>(filePath, response).catch((error: Error) => {
          return Promise.reject(
            new Error(`cache write error: ${filePath}`, { cause: error })
          );
        })
      : Promise.resolve()
    ).then(() => response);

  return requestRemoteBare<ResponseData, RequestData>(slug, config).then(
    handlePostRequest
  );
};
