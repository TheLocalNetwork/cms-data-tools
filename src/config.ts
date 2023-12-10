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
export interface IPackageConfig {
  cache: ICacheConfig;
  network: INetworkConfig;
  requestConfig: AxiosRequestConfig;
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
};

export const defaultPackageConfig: Readonly<IPackageConfig> = {
  cache: { ...defaultCacheConfig },
  network: { ...defaultNetworkConfig },
  requestConfig: { ...defaultRequestConfig },
};

/**
 * config SINGLETON
 * @name config
 * @private
 */
let config: IPackageConfig = { ...defaultPackageConfig };

export const getConfig = (): IPackageConfig => config;

export const setConfig = (
  newConfig: Partial<IPackageConfig> = {}
): IPackageConfig => {
  config = withConfig(newConfig); // mutate the singleton

  return config;
};

export const withConfig = (
  tempConfig: Partial<IPackageConfig> = {}
): IPackageConfig => {
  return {
    cache: { ...config.cache, ...tempConfig.cache },
    network: { ...config.network, ...tempConfig.network },
    requestConfig: { ...config.requestConfig, ...tempConfig.requestConfig },
  };
};
