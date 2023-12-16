import { outputJson } from 'fs-extra';
import { compact } from 'lodash';
import path from 'node:path';
// import pLimit from 'p-limit';
import pLimit from 'p-limit';
import { withConfig, type IPackageConfig } from './config';
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

export const downloadDatasetData = async (
  id: TDataGovUUID,
  outputDirectory: string,
  config?: IPackageConfig
) => {
  const { network } = withConfig(config);
  const { pageSize, simultaneousRequests } = network;

  const dataSetMeta = await getDatasetMeta(id);

  const numRequests = Math.ceil(dataSetMeta.total_rows / pageSize);
  const offsets = Array.from({ length: numRequests }, (_, i) => i).map(
    (i) => i * pageSize
  );

  // eslint-disable-next-line no-console
  console.info({
    offset: dataSetMeta.offset,
    total_rows: dataSetMeta.total_rows,
    size: dataSetMeta.size,
    numRequests,
    offsets,
  });

  const limit = pLimit(simultaneousRequests);

  return Promise.allSettled(
    offsets.map((offset) =>
      limit(() =>
        getDatasetDataPage(id, offset, pageSize, {
          requestConfig: { 'axios-retry': { retries: 3 } },
        })
      ).then((data) => {
        const fileName = `${id}_${offset}.json`;
        const filePath = path.resolve(outputDirectory, fileName);

        return outputJson(filePath, data);
      })
    )
  );
};

// const pLimit = async (concurrency: number) =>
//   import('p-limit').then((m) => m.default).then((fn) => fn(concurrency));

export const getDatasetDataPage = async <T>(
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
