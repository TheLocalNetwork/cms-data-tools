import { camelCase, snakeCase, upperFirst } from 'lodash';
import * as prettier from 'prettier';
import { getCatalogDataSetById, getCatalogDataSetsByKeyword } from '../catalog';
import { type IPackageConfig } from '../config';
import { getDatasetMeta } from '../dataset';
import {
  type IDataGovCatalogDataset,
  type IDataGovDatasetTableSchemaField,
  type TDataGovUUID,
} from '../types';
import { schemaFieldsTypeMap } from './dataset-schema';
import { handleSettledPromise } from './promise';

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
      interfaceName ?? defaultInterfaceName,
      catalogDataset
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
  interfaceName: string,
  catalogDataset?: IDataGovCatalogDataset
) => {
  const properties = fields.map((field) =>
    generateDatasetTypeFromFieldsItem(field)
  );

  const interfaceJsDoc = catalogDataset
    ? getInterfaceJsDoc(fields, interfaceName, catalogDataset)
    : '';

  const typeScript = [
    interfaceJsDoc,
    `export interface ${interfaceName} {`,
    ...properties,
    `}`,
  ].join('\n');

  const prettyTypeScript = prettier.format(typeScript, {
    parser: 'typescript',
  });

  return prettyTypeScript;
};

const getInterfaceJsDoc = <T>(
  fields: IDataGovDatasetTableSchemaField<T>[],
  interfaceName: string,
  catalogDataset: IDataGovCatalogDataset
) => {
  const properties = fields.map(
    (field) => `@property {${field.type}} ${getFieldNameKey(field)}`
  );
  const originalJSON = Object.entries(catalogDataset).map(([k, v]) => {
    if (k === 'distribution') return `${JSON.stringify(k)}: []`;
    return `${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  });
  const jsDocLineSeparator = `\n * `;
  const interfaceJsDocBody =
    ` * ` +
    [
      `@name ${interfaceName}`,
      `@summary ${catalogDataset.title}`,
      ...properties,
      `@description ${catalogDataset.description}`,
      '```',
      ...originalJSON,
      '```',
    ].join(jsDocLineSeparator);
  const interfaceJsDoc = [`/**`, interfaceJsDocBody, ` */`].join(`\n`);

  return interfaceJsDoc;
};

export const getFieldNameKey = <T>(
  field: IDataGovDatasetTableSchemaField<T>
) => {
  return snakeCase(field.name.toString());
};

const generateDatasetTypeFromFieldsItem = <T>(
  field: IDataGovDatasetTableSchemaField<T>
) => {
  const key = getFieldNameKey(field);

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
  const name = getFieldNameKey(field);
  const jsDocLineSeparator = `\n * `;

  const originalJSON = Object.entries(field).map(
    ([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`
  );

  const jsDocBody =
    ` * ` +
    [
      `@name ${name}`,
      `@type {${field.type}}`,
      `@description`,
      '```',
      ...originalJSON,
      '```',
    ].join(jsDocLineSeparator);

  return [`/**`, jsDocBody, ` */`].join(`\n`);
};
