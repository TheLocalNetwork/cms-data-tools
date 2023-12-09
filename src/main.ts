export * from './types';

export {
  defaultPackageConfig,
  getConfig,
  setConfig,
  withConfig,
  type IPackageConfig,
} from './config';
export { getDataCatalog, getDataCatalogResponse } from './data';

// export class CmsDataTools {
//   private config: IPackageConfig;
//   private axiosClient: AxiosInstance;

//   constructor(customConfig: Partial<IPackageConfig>) {
//     this.config = { ...defaultPackageConfig, ...customConfig };
//     this.axiosClient = getAxiosClient(this.config);

//     // console.info(`cms-data-tools`, `init`, this.options);

//     return this;
//   }

//   public async retrieveData<T>(
//     slug: string,
//     options?: Partial<IPackageConfig>
//   ): Promise<AxiosResponse<T>> {
//     const fnOptions = { ...this.config, ...options };
//     if (!fnOptions.enableLocalCache) {
//       // console.info(`cms-data-tools`, 'cache disabled', { slug });
//       return this.fetchDataRemote<T>(slug);
//     }

//     const filePath = getFilePath(fnOptions.cacheDirectory, slug);

//     if (!pathExistsSync(filePath)) {
//       // console.info(`cms-data-tools`, 'no cache found', { slug });
//       return this.fetchDataRemote<T>(slug);
//     }

//     return readFromCache<T>(filePath).then((cachedResponse) => {
//       if (isCacheExpired(cachedResponse)) {
//         // console.info(`cms-data-tools`, 'cache is still valid', { slug });
//         return cachedResponse;
//       }

//       return this.axiosClient.head(slug).then((remoteResponse) => {
//         if (isCacheOutOfDate(cachedResponse, remoteResponse)) {
//           // console.info(`cms-data-tools`, 'cache is outdated', { slug });
//           return this.fetchDataRemote(slug);
//         }

//         // console.info(`cms-data-tools`, 'cache is still valid', { slug });
//         return cachedResponse;
//       });
//     });
//   }

//   public async getDataCatalog<T = IDataGovCatalog>(
//     options?: Partial<IPackageConfig>
//   ) {
//     return this.retrieveData<T>(`data.json`, options);
//   }

//   public async getCatalogDataSetById(
//     uuid: TDataGovUUID,
//     options?: Partial<IPackageConfig>
//   ) {
//     if (!isTDataGovUUID(uuid)) throw new Error('invalid id');

//     return this.getDataCatalog(options).then((catalog) =>
//       catalog.data.dataset.find((dataSet) => dataSet.identifier.includes(uuid))
//     );
//   }

//   public async getCatalogDataSetsByKeyword(
//     keyword: string,
//     options?: Partial<IPackageConfig>
//   ) {
//     return this.getDataCatalog(options).then((catalog) =>
//       catalog.data.dataset.filter((item) => item.keyword.includes(keyword))
//     );
//   }

//   public async generateTypescriptInterfaceForDataset<T>(
//     id: TDataGovUUID,
//     interfaceName = `IDataset`,
//     options?: Partial<IPackageConfig>
//   ) {
//     const { data } = await this.retrieveData<IDataGovDataset<T>>(
//       `data-api/v1/dataset/${id}/data-viewer?size=0`,
//       options
//     );

//     const { fields } = data.meta.data_file_meta_data.tableSchema.descriptor;
//     const types = fields.map((field) => {
//       const key = field.name.toString();
//       const type =
//         field.type in schemaFieldsTypeMap
//           ? schemaFieldsTypeMap[field.type]
//           : `unknown /*${field.type}*/`;

//       return [
//         `\t/**`,
//         `\t * @name ${key}`,
//         `\t * @type {${field.type}}`,
//         `\t * @description`,
//         `\t * \`\`\``,
//         Object.entries(field)
//           .map(([k, v]) => `\t * \t${JSON.stringify(k)}: ${JSON.stringify(v)}`)
//           .join('\n'),
//         `\t * \`\`\``,
//         `\t */`,
//         `\t${key}: ${type};`,
//         ``,
//       ].join('\n');
//     });

//     const typeScript = [
//       `export interface ${interfaceName}`,
//       `{`,
//       ...types,
//       `}`,
//     ].join('\n');

//     return typeScript;
//   }
// }

// const schemaFieldsTypeMap: Record<string, string> = {
//   string: 'string',
//   number: 'number',
// };

// const schemaFieldsTypeParsers: Record<
//   keyof typeof schemaFieldsTypeMap,
//   (val: unknown) => unknown
// > = {
//   string: toString,
//   number: toNumber,
// };

// const getSchemaFieldsTypeParser = (type: keyof typeof schemaFieldsTypeMap) =>
//   schemaFieldsTypeParsers[type] ?? (() => undefined);

// export const jsonApiToRecordSet = <T>(dataSet: IDataGovDataset<T>) => {
//   const { fields } = dataSet.meta.data_file_meta_data.tableSchema.descriptor;

//   return dataSet.data.map((rowValues) => {
//     const record: T = fields.reduce<Partial<T>>((acc, field, columnIndex) => {
//       const { name, type } = field;
//       const value = rowValues[columnIndex];
//       const parsedValue = getSchemaFieldsTypeParser(type)(value);

//       return {
//         ...acc,
//         [name]: parsedValue,
//       };
//     }, {}) as T;

//     return record;
//   });
// };

// export default CmsDataTools;
