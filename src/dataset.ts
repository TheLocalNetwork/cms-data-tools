import { outputJson } from 'fs-extra';
import { compact } from 'lodash';
import path from 'node:path';
// import pLimit from 'p-limit';
import pLimit from 'p-limit';
import { getCatalogDataSetsByKeyword } from './catalog';
import { withConfig, type IPackageConfig } from './config';
import { retrieveData } from './data';
import {
  uuidRegex,
  type IDataGovCatalogDataset,
  type IDataGovDataset,
  type IDataGovDatasetData,
  type TDataGovUUID,
} from './types';
import { getDateFromHeader } from './utils/net';
import { sleep } from './utils/promise';

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

export const getDatasetMetaRequest = async <T>(
  id: TDataGovUUID,
  config?: Partial<IPackageConfig>
) => {
  const params = { size: '0' };
  const searchParams = new URLSearchParams(params);
  const datasetUrl = getDatasetUrl(id, searchParams);

  return retrieveData<IDataGovDataset<T>>(datasetUrl, config).then(
    (result) => result
  );
};

export const getDatasetMeta = async <T>(
  id: TDataGovUUID,
  config?: Partial<IPackageConfig>
) => getDatasetMetaRequest<T>(id, config).then((result) => result.data.meta);

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
  config?: IPackageConfig,
  plimit = pLimit(withConfig(config).network.simultaneousRequests)
) => {
  const { network } = withConfig(config);
  const { pageSize } = network;

  const dataSetMeta = await getDatasetMeta(id);

  const numRequests = Math.ceil(dataSetMeta.total_rows / pageSize);
  const offsets = Array.from({ length: numRequests }, (_, i) => i).map(
    (i) => i * pageSize
  );

  // eslint-disable-next-line no-console
  console.info({
    total_rows: dataSetMeta.total_rows,
    numRequests,
    offsets,
  });

  const iterator = (offset: number) => {
    const { pendingCount, activeCount } = plimit;
    const offsetPadded = offset.toLocaleString().padStart(11, ' ');
    const pendingPadded = pendingCount.toLocaleString().padStart(5, ' ');
    const timerLabel = `${id}\t${offsetPadded}\tstatus: ${activeCount} / ${pendingPadded}`;
    console.time(timerLabel);
    return getDatasetDataPage(id, offset, pageSize, config)
      .then((data) => writeDatasetDataPage(data, id, offset, outputDirectory))
      .then(() => sleep(network.pageWaitMS))
      .finally(() => {
        console.timeEnd(timerLabel);
      });
  };

  return Promise.allSettled(
    offsets.map((offset) => plimit(() => iterator(offset)))
  );
};

export const downloadDatasetDataByKeyword = async (
  keyword: string,
  outputDirectory: string,
  config?: IPackageConfig,
  plimit = pLimit(withConfig(config).network.simultaneousRequests)
) => {
  const datasetLimit = pLimit(1); // only process one dataset at a time

  return getCatalogDataSetsByKeyword(keyword, config).then((datasets) => {
    const iterator = ({ id }: IDataGovCatalogDataset) =>
      downloadDatasetData(id, outputDirectory, config, plimit);

    return Promise.allSettled(
      datasets.map((dataset) => datasetLimit(() => iterator(dataset)))
    );
  });
};

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

  return retrieveData<IDataGovDataset<T>>(datasetUrl, config).then(
    (result) => result.data.data
  );
};

const writeDatasetDataPage = async (
  data: IDataGovDatasetData[],
  id: TDataGovUUID,
  offset: number,
  outputDirectory: string
) => {
  const fileName = `${offset}.json`;
  const filePath = path.resolve(outputDirectory, id, fileName);

  return outputJson(filePath, data).then(() => fileName);
};

export const isDatasetUpdateAvailable = async (
  id: string,
  lastModifiedDate: Date,
  config: Partial<IPackageConfig> = {}
) => {
  return getDatasetMetaRequest(id, config).then(({ headers }) => {
    const lastModifiedRemoteDate = getDateFromHeader(headers, 'last-modified');
    return lastModifiedRemoteDate > lastModifiedDate;
  });
};
