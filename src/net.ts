import { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { getAxiosClient } from './axiosClient';
import { withConfig, type IPackageConfig } from './config';
import { getFilePath, writeToCache } from './fs';
import { isCacheFresh } from './utils';

export const requestRemoteBare = async <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  customRequestConfig?: AxiosRequestConfig
): Promise<AxiosResponse<ResponseData>> => {
  const requestConfig: AxiosRequestConfig<RequestData> = {
    method: 'GET',
    url: slug,
    ...customRequestConfig,
  };

  return getAxiosClient().request<
    ResponseData,
    AxiosResponse<ResponseData>,
    RequestData
  >(requestConfig);
};

export const requestRemoteHead = <
  ResponseData = unknown,
  RequestData = unknown,
>(
  slug: string,
  customRequestConfig?: AxiosRequestConfig
) =>
  requestRemoteBare<ResponseData, RequestData>(slug, {
    ...customRequestConfig,
    method: 'HEAD',
  });

export const isRemoteNewer = async <ResponseData, RequestData>(
  slug: string,
  cachedResponse: AxiosResponse<ResponseData, RequestData>,
  customRequestConfig?: AxiosRequestConfig
) =>
  requestRemoteHead<ResponseData, RequestData>(slug, customRequestConfig).then(
    (remoteResponse) => isCacheFresh(cachedResponse, remoteResponse)
  );

export const requestRemote = async <
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
  const filePath = getFilePath(fnConfig.cacheDirectory, slug);

  const postRequest = (
    response: AxiosResponse<ResponseData>
  ): Promise<AxiosResponse<ResponseData>> =>
    (fnConfig.enableLocalCache
      ? writeToCache<ResponseData>(filePath, response).catch((error: Error) => {
          return Promise.reject(
            new Error(`cache write error: ${filePath}`, { cause: error })
          );
        })
      : Promise.resolve()
    ).then(() => response);

  return requestRemoteBare<ResponseData, RequestData>(
    slug,
    options?.requestConfig
  ).then(postRequest);
};
