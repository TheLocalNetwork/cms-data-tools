import Axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { pathExistsSync } from 'fs-extra';
import { toNumber, toString } from 'lodash';
import {
  getDefaultCacheDirectory,
  getFilePath,
  readFromCache,
  writeToCache,
} from './fs';
import { type IDataGovCatalog } from './types/catalog';
import { type IDataGovDataset } from './types/dataset';
import { isTDataGovUUID } from './types/guards';
import { type TDataGovUUID } from './types/util';
import { isCacheExpired, isCacheOutOfDate } from './utils';

export * from './types';

export interface IOptions {
  enableLocalCache: boolean;
  baseURL: string;
  cacheDirectory: string;
  pageSize: number;
  pageWaitMS: number;
}

export const defaultOptions: IOptions = {
  baseURL: `https://data.cms.gov`,
  enableLocalCache: true,
  cacheDirectory: getDefaultCacheDirectory(),
  pageSize: 5_000,
  pageWaitMS: 100,
};

export class CmsDataTools {
  private options: IOptions;
  private axiosClient: AxiosInstance;

  constructor(options: Partial<IOptions>) {
    this.options = { ...defaultOptions, ...options };
    this.axiosClient = Axios.create({ baseURL: this.options.baseURL });

    // console.info(`cms-data-tools`, `init`, this.options);

    return this;
  }

  public async fetchDataRemote<T>(
    slug: string,
    options?: Partial<IOptions>
  ): Promise<AxiosResponse<T>> {
    const fnOptions = { ...this.options, ...options };
    const filePath = getFilePath(fnOptions.cacheDirectory, slug);

    // console.info(`cms-data-tools`, 'fetching data', { slug });

    return this.axiosClient.get<T>(slug).then(async (response) => {
      if (fnOptions.enableLocalCache) {
        await writeToCache<T>(filePath, response);
      }
      return response;
    });
  }

  public async retrieveData<T>(
    slug: string,
    options?: Partial<IOptions>
  ): Promise<AxiosResponse<T>> {
    const fnOptions = { ...this.options, ...options };
    if (!fnOptions.enableLocalCache) {
      // console.info(`cms-data-tools`, 'cache disabled', { slug });
      return this.fetchDataRemote<T>(slug);
    }

    const filePath = getFilePath(fnOptions.cacheDirectory, slug);

    if (!pathExistsSync(filePath)) {
      // console.info(`cms-data-tools`, 'no cache found', { slug });
      return this.fetchDataRemote<T>(slug);
    }

    return readFromCache<T>(filePath).then((cachedResponse) => {
      if (isCacheExpired(cachedResponse)) {
        // console.info(`cms-data-tools`, 'cache is still valid', { slug });
        return cachedResponse;
      }

      return this.axiosClient.head(slug).then((remoteResponse) => {
        if (isCacheOutOfDate(cachedResponse, remoteResponse)) {
          // console.info(`cms-data-tools`, 'cache is outdated', { slug });
          return this.fetchDataRemote(slug);
        }

        // console.info(`cms-data-tools`, 'cache is still valid', { slug });
        return cachedResponse;
      });
    });
  }

  public async getDataCatalog<T = IDataGovCatalog>(
    options?: Partial<IOptions>
  ) {
    return this.retrieveData<T>(`data.json`, options);
  }

  public async getCatalogDataSetById(
    uuid: TDataGovUUID,
    options?: Partial<IOptions>
  ) {
    if (!isTDataGovUUID(uuid)) throw new Error('invalid id');

    return this.getDataCatalog(options).then((catalog) =>
      catalog.data.dataset.find((dataSet) => dataSet.identifier.includes(uuid))
    );
  }

  public async getCatalogDataSetsByKeyword(
    keyword: string,
    options?: Partial<IOptions>
  ) {
    return this.getDataCatalog(options).then((catalog) =>
      catalog.data.dataset.filter((item) => item.keyword.includes(keyword))
    );
  }

  public async generateTypescriptInterfaceForDataset<T>(
    id: TDataGovUUID,
    interfaceName = `IDataset`,
    options?: Partial<IOptions>
  ) {
    const { data } = await this.retrieveData<IDataGovDataset<T>>(
      `data-api/v1/dataset/${id}/data-viewer?size=0`,
      options
    );

    const { fields } = data.meta.data_file_meta_data.tableSchema.descriptor;
    const types = fields.map((field) => {
      const key = field.name.toString();
      const type =
        field.type in schemaFieldsTypeMap
          ? schemaFieldsTypeMap[field.type]
          : `unknown /*${field.type}*/`;

      return [
        `\t/**`,
        `\t * @name ${key}`,
        `\t * @type {${field.type}}`,
        `\t * @description`,
        `\t * \`\`\``,
        Object.entries(field)
          .map(([k, v]) => `\t * \t${JSON.stringify(k)}: ${JSON.stringify(v)}`)
          .join('\n'),
        `\t * \`\`\``,
        `\t */`,
        `\t${key}: ${type};`,
        ``,
      ].join('\n');
    });

    const typeScript = [
      `export interface ${interfaceName}`,
      `{`,
      ...types,
      `}`,
    ].join('\n');

    return typeScript;
  }
}

const schemaFieldsTypeMap: Record<string, string> = {
  string: 'string',
  number: 'number',
};

const schemaFieldsTypeParsers: Record<
  keyof typeof schemaFieldsTypeMap,
  (val: unknown) => unknown
> = {
  string: toString,
  number: toNumber,
};

const getSchemaFieldsTypeParser = (type: keyof typeof schemaFieldsTypeMap) =>
  schemaFieldsTypeParsers[type] ?? (() => undefined);

export const jsonApiToRecordSet = <T>(dataSet: IDataGovDataset<T>) => {
  const { fields } = dataSet.meta.data_file_meta_data.tableSchema.descriptor;

  return dataSet.data.map((rowValues) => {
    const record: T = fields.reduce<Partial<T>>((acc, field, columnIndex) => {
      const { name, type } = field;
      const value = rowValues[columnIndex];
      const parsedValue = getSchemaFieldsTypeParser(type)(value);

      return {
        ...acc,
        [name]: parsedValue,
      };
    }, {}) as T;

    return record;
  });
};

// export async function test(): Promise<void> {
//   const cmsDataTools = new CmsDataTools({ enableLocalCache: true });

//   // const dataCatalog = await cmsDataTools.getDataCatalog();
//   // console.log('done', dataCatalog.data.dataset.length);

//   // const dataSetResponse = await cmsDataTools.retrieveData<
//   //   IDataGovDataset<IMedicalSupplies>
//   // >(
//   //   `data-api/v1/dataset/86b4807a-d63a-44be-bfdf-ffd398d5e623/data-viewer?size=10`
//   // );
//   // const result = dataSetResponse.data;
//   // const { data } = result;

//   // const records = jsonApiToRecordSet(dataSetResponse.data);
//   // const record = records[0];

//   // console.log('done', data.length, record);

//   // const resultById = await cmsDataTools.getCatalogDataSetById(
//   //   '86b4807a-d63a-44be-bfdf-ffd398d5e623'
//   // );
//   // console.log(`resultById`, resultById !== undefined);

//   // const resultsByKeyword = await cmsDataTools.getCatalogDataSetsByKeyword(
//   //   'Medical Suppliers & Equipment'
//   // );
//   // console.log(`resultsByKeyword`, resultsByKeyword.length);

//   // const typeInterface = await cmsDataTools.generateTypescriptInterfaceForDataset(
//   //   `86b4807a-d63a-44be-bfdf-ffd398d5e623`,
//   //   'IMedicalSupplies'
//   // );

//   // await outputFile(`./src/types/generated/IMedicalSupplies.ts`, typeInterface);
// }

// (async () => {
//   // await cleanupCache();
//   await test();

//   return process.exit(0);
// })().catch(console.error);

export default CmsDataTools;
