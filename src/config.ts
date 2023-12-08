import { type AxiosRequestConfig } from 'axios';
import deepmerge from 'deepmerge';
import { getDefaultCacheDirectory } from './fs';

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

export const defaultCacheConfig: ICacheConfig = Object.freeze({
  enableLocalCache: true,
  cacheDirectory: getDefaultCacheDirectory(),
});

export const defaultNetworkConfig: INetworkConfig = Object.freeze({
  pageSize: 5_000,
  pageWaitMS: 100,
  simultaneousRequests: 1,
});

export const defaultRequestConfig: AxiosRequestConfig = Object.freeze({
  baseURL: `https://data.cms.gov`,
});

export const defaultPackageConfig: IPackageConfig = Object.freeze({
  cache: { ...defaultCacheConfig },
  network: { ...defaultNetworkConfig },
  requestConfig: { ...defaultRequestConfig },
});

/**
 * config SINGLETON
 * @name config
 * @private
 */
let config: IPackageConfig = { ...defaultPackageConfig };

export const getConfig = (): IPackageConfig => config;

const mergedConfig = (toMerge: Partial<IPackageConfig>): IPackageConfig =>
  deepmerge({ ...config }, toMerge);

export const setConfig = (
  newConfig: Partial<IPackageConfig> = {}
): IPackageConfig => {
  config = mergedConfig(newConfig);

  return config;
};

export const withConfig = (
  tempConfig: Partial<IPackageConfig> = {}
): IPackageConfig => mergedConfig(tempConfig);
