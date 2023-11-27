import Axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { withConfig, type IPackageConfig } from './config';

/**
 * axiosClient SINGLETON
 * @name axiosClient
 * @private
 */
let axiosClient: AxiosInstance;

export interface IAxiosConfigOptions {
  packageConfig?: Partial<IPackageConfig>;
  axiosConfig?: CreateAxiosDefaults;
}
export const getAxiosConfig = (
  options?: IAxiosConfigOptions
): CreateAxiosDefaults => {
  const { packageConfig, axiosConfig } = options ?? {};

  return {
    baseURL: withConfig(packageConfig).baseURL,
    ...axiosConfig,
  };
};

export const createAxiosClient = (options?: IAxiosConfigOptions) => {
  axiosClient = Axios.create(getAxiosConfig(options));
  return axiosClient;
};

export const getAxiosClient = (): AxiosInstance => axiosClient;
