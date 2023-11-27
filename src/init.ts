import { type CreateAxiosDefaults } from 'axios';
import { createAxiosClient } from './axiosClient';
import { setConfig, type IPackageConfig } from './config';

export interface IInitOptions {
  packageConfig?: Partial<IPackageConfig>;
  axiosConfig?: CreateAxiosDefaults;
}

export const init = (initOptions: IInitOptions = {}) => {
  const { packageConfig } = initOptions;
  createAxiosClient(initOptions);
  return setConfig(packageConfig);
};
