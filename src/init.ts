import { setConfig, type IPackageConfig } from './config';

export const init = (config: Partial<IPackageConfig> = {}) => setConfig(config);
