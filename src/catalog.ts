import { type AxiosResponse } from 'axios';
import { some } from 'lodash';
import { type IPackageConfig } from './config';
import { retrieveData } from './data';
import { getIdFromDatasetIdentifier } from './dataset';
import {
  isTDataGovUUID,
  type IDataGovCatalog,
  type IDataGovCatalogDataset,
  type TDataGovUUID,
} from './types';

export const getCatalogAxiosResponse = async (
  config: Partial<IPackageConfig> = {}
): Promise<AxiosResponse<IDataGovCatalog>> => {
  return retrieveData<IDataGovCatalog, never>(`data.json`, config);
};

export const getCatalog = async (
  config: Partial<IPackageConfig> = {}
): Promise<IDataGovCatalog> => {
  return getCatalogAxiosResponse(config)
    .then(({ data }) => data)
    .then(enhanceCatalogData);
};

const enhanceCatalogData = (data: IDataGovCatalog) => {
  const dataset = data.dataset.map((item) => {
    const id = getIdFromDatasetIdentifier(item.identifier);
    return { ...item, id };
  });

  return { ...data, dataset };
};

export const getCatalogDataSetById = async (
  uuid: TDataGovUUID,
  config: Partial<IPackageConfig> = {}
): Promise<IDataGovCatalogDataset | undefined> => {
  if (!isTDataGovUUID(uuid)) throw new Error('invalid id');

  return getCatalog(config).then((catalog) =>
    catalog.dataset.find((item) => item.identifier.includes(uuid))
  );
};

export const getCatalogDataSetsByKeyword = async (
  keyword: string,
  options?: Partial<IPackageConfig>
): Promise<IDataGovCatalogDataset[]> => {
  return getCatalog(options).then((catalog) =>
    catalog.dataset.filter((item) => {
      const hasKeyword = item.keyword.includes(keyword);
      const hasApiDistribution = some(item.distribution, { format: 'API' });

      return hasKeyword && hasApiDistribution;
    })
  );
};
