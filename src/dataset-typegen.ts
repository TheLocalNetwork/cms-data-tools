import { camelCase, upperFirst } from 'lodash';
import { getCatalogDataSetById, getCatalogDataSetsByKeyword } from './catalog';
import { type IPackageConfig } from './config';
import { retrieveData } from './data';
import { getDatasetUrl, schemaFieldsTypeMap } from './dataset';
import {
  type IDataGovDataset,
  type IDataGovDatasetTableSchemaField,
  type TDataGovUUID,
} from './types';
import { handleSettledPromise } from './utils/promise';

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

export const getDatasetTypeInterfaceName = (title: string) =>
  `I${upperFirst(camelCase(title))}`;

export const generateDatasetTypeById = async <T>(
  id: TDataGovUUID,
  interfaceName?: string,
  config?: Partial<IPackageConfig>
) => {
  return Promise.all([
    getDatasetMeta<T>(id, config),
    getCatalogDataSetById(id, config),
  ]).then((results) => {
    const [datasetMeta, catalogDataset] = results;
    const fields =
      datasetMeta.data_file_meta_data.tableSchema.descriptor.fields;

    const defaultInterfaceName = getDatasetTypeInterfaceName(
      catalogDataset?.title ?? `Dataset${id}`
    );

    return generateDatasetTypeFromFields(
      fields,
      interfaceName ?? defaultInterfaceName
    );
  });
};

export const generateDatasetTypeByKeyword = async (keyword: string) => {
  return getCatalogDataSetsByKeyword(keyword).then((datasetsByKeyword) => {
    return Promise.allSettled(
      datasetsByKeyword.map((dataset) =>
        generateDatasetTypeById(dataset.id).then((typeInterface) => ({
          dataset,
          typeInterface,
        }))
      )
    ).then(handleSettledPromise);
  });
};

const generateDatasetTypeFromFields = <T>(
  fields: IDataGovDatasetTableSchemaField<T>[],
  interfaceName: string
) => {
  const properties = fields.map((field) =>
    generateDatasetTypeFromFieldsItem(field)
  );

  const typeScript = [
    `export interface ${interfaceName} {`,
    ...properties,
    `}`,
  ].join('\n');

  return typeScript;
};

const generateDatasetTypeFromFieldsItem = <T>(
  field: IDataGovDatasetTableSchemaField<T>
) => {
  const key = field.name.toString();
  const type =
    field.type in schemaFieldsTypeMap
      ? schemaFieldsTypeMap[field.type]
      : `unknown /*${field.type}*/`;

  const jsDoc = generateDatasetTypeFromFieldsItemJsDoc(field);

  return [``, jsDoc, ``, `${key}: ${type};`, ``].join(`\n`);
};

const generateDatasetTypeFromFieldsItemJsDoc = <T>(
  field: IDataGovDatasetTableSchemaField<T>
) => {
  const key = field.name.toString();
  const jsDocLineSeparator = `\n * `;

  const originalJSON = Object.entries(field).map(
    ([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`
  );

  const jsDocBody =
    ` * ` +
    [
      `@name ${key}`,
      `@type {${field.type}}`,
      `@description`,
      '```',
      ...originalJSON,
      '```',
    ].join(jsDocLineSeparator);

  return [`/**`, jsDocBody, ` */`].join(`\n`);
};
