import { compact } from 'lodash';
import { type IPackageConfig } from './config';
import { retrieveData } from './data';
import {
  uuidRegex,
  type IDataGovCatalogDataset,
  type IDataGovDataset,
  type TDataGovUUID,
} from './types';

export {
  generateDatasetTypeById,
  generateDatasetTypeByKeyword,
  getDatasetTypeInterfaceName,
} from './utils/dataset-typegen';

export const getDatasetUrl = (
  id: TDataGovUUID,
  searchParams?: URLSearchParams
) =>
  compact([
    `data-api/v1/dataset/${id}/data-viewer`,
    searchParams?.toString(),
  ]).join('?');

export const getDatasetMeta = async <T>(
  id: TDataGovUUID,
  config?: Partial<IPackageConfig>
) => {
  const params = { size: '0' };
  const searchParams = new URLSearchParams(params);
  const datasetUrl = getDatasetUrl(id, searchParams);

  return retrieveData<IDataGovDataset<T>>(datasetUrl, config).then(
    (result) => result.data.meta
  );
};

export const getIdFromDatasetIdentifier = (
  identifier: IDataGovCatalogDataset['identifier']
): TDataGovUUID => {
  const match = identifier.match(uuidRegex);

  if (!match) throw new Error(`Invalid identifier: ${identifier}`);
  return match[0];
};

export const getDatasetData = async <T>(
  id: TDataGovUUID,
  offset = 0,
  pageSize = 5_000,
  config?: Partial<IPackageConfig>
) => {
  const params: Record<string, string> = {
    size: pageSize.toString(),
    offset: offset.toString(),
  };
  const searchParams = new URLSearchParams(params);
  const datasetUrl = getDatasetUrl(id, searchParams);
  console.time(datasetUrl);

  return retrieveData<IDataGovDataset<T>>(datasetUrl, config).then((result) => {
    const { data } = result.data;
    console.timeEnd(datasetUrl);
    return data;
  });
};
