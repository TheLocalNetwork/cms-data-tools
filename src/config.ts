import { type AxiosRequestConfig } from 'axios';
import { getDefaultCacheDirectory } from './utils/cache';

export interface ICacheConfig {
  enableLocalCache: boolean;
  cacheDirectory: string;
}
export interface INetworkConfig {
  pageSize: number;
  pageWaitMS: number;
  simultaneousRequests: number;
}
export interface IPackageConfigSingleton {
  cache: ICacheConfig;
  network: INetworkConfig;
  requestConfig: AxiosRequestConfig;
}

export interface IPackageConfig {
  cache?: Partial<ICacheConfig>;
  network?: Partial<INetworkConfig>;
  requestConfig?: AxiosRequestConfig;
}

export const defaultCacheConfig: Readonly<ICacheConfig> = {
  enableLocalCache: true,
  cacheDirectory: getDefaultCacheDirectory(),
};

export const defaultNetworkConfig: Readonly<INetworkConfig> = {
  pageSize: 5_000,
  pageWaitMS: 100,
  simultaneousRequests: 1,
};

export const defaultRequestConfig: Readonly<AxiosRequestConfig> = {
  baseURL: `https://data.cms.gov`,
  'axios-retry': {
    retries: 0,
  },
};

export const defaultPackageConfig: Readonly<IPackageConfigSingleton> = {
  cache: { ...defaultCacheConfig },
  network: { ...defaultNetworkConfig },
  requestConfig: { ...defaultRequestConfig },
};

/**
 * config SINGLETON
 * @name config
 * @private
 */
let config: IPackageConfigSingleton = { ...defaultPackageConfig };

export const getConfig = (): IPackageConfigSingleton => config;

export const setConfig = (
  newConfig: IPackageConfig = {}
): IPackageConfigSingleton => {
  config = withConfig(newConfig); // mutate the singleton

  return config;
};

export const withConfig = (
  tempConfig: IPackageConfig = {}
): IPackageConfigSingleton => {
  return {
    cache: { ...config.cache, ...tempConfig.cache },
    network: { ...config.network, ...tempConfig.network },
    requestConfig: { ...config.requestConfig, ...tempConfig.requestConfig },
  };
};
