import axios, { type AxiosResponse } from 'axios';
import { withConfig, type IPackageConfig } from './config';
import { getFilePath, writeToCache } from './fs';
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

export const requestRemoteHead = <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  config: Partial<IPackageConfig> = {}
) => {
  const fnConfig = withConfig(config);

  return requestRemoteBare<ResponseData, RequestData>(slug, {
    ...fnConfig,
    ...{
      ...fnConfig.requestConfig,
      method: 'HEAD',
    },
  });
};

export const isRemoteNewer = async <ResponseData, RequestData>(
  slug: string,
  cachedResponse: AxiosResponse<ResponseData, RequestData>,
  config: Partial<IPackageConfig> = {}
) =>
  requestRemoteHead<ResponseData, RequestData>(slug, config).then(
    (remoteResponse) => isCacheFresh(cachedResponse, remoteResponse)
  );

export const requestRemote = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<ResponseData>> => {
  const fnConfig = withConfig(config);
  const filePath = getFilePath(fnConfig.cache.cacheDirectory, slug);

  const handlePostRequest = (
    response: AxiosResponse<ResponseData>
  ): Promise<AxiosResponse<ResponseData>> =>
    (fnConfig.cache.enableLocalCache
      ? writeToCache<ResponseData>(filePath, response).catch((error: Error) => {
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
