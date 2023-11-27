import { getDefaultCacheDirectory } from './fs';

export interface IPackageConfig {
  baseURL: string;
  pageSize: number;
  pageWaitMS: number;
  enableLocalCache: boolean;
  cacheDirectory: string;
}

export const defaultPackageConfig: IPackageConfig = Object.freeze({
  baseURL: `https://data.cms.gov`,
  pageSize: 5_000,
  pageWaitMS: 100,
  enableLocalCache: true,
  cacheDirectory: getDefaultCacheDirectory(),
});

/**
 * config SINGLETON
 * @name config
 * @private
 */
let config: IPackageConfig = { ...defaultPackageConfig };

export const getConfig = (): IPackageConfig => config;

export const setConfig = (
  newConfig?: Partial<IPackageConfig>
): IPackageConfig => {
  config = { ...config, ...newConfig };
  return config;
};

export const withConfig = (
  tempConfig?: Partial<IPackageConfig>
): IPackageConfig => ({
  ...config,
  ...tempConfig,
});
