import { type IPackageConfig } from './config';
import { retrieveData } from './data';
import { getDatasetUrl, schemaFieldsTypeMap } from './dataset';
import {
  type IDataGovDataset,
  type IDataGovDatasetTableSchemaField,
  type TDataGovUUID,
} from './types';

export const generateDatasetType = async <T>(
  id: TDataGovUUID,
  getInterfaceName:
    | string
    | ((dataset: IDataGovDataset<T>) => string) = `IDataset`,
  config?: Partial<IPackageConfig>
) => {
  const params = { size: '0' };
  const searchParams = new URLSearchParams(params);
  const datasetUrl = getDatasetUrl(id, searchParams);

  return retrieveData<IDataGovDataset<T>>(datasetUrl, config).then(
    ({ data }) => {
      const fields =
        data.meta.data_file_meta_data.tableSchema.descriptor.fields;

      const interfaceName =
        typeof getInterfaceName === 'function'
          ? getInterfaceName(data)
          : getInterfaceName;

      const typeScript = generateDatasetTypeFromFields(fields, interfaceName);

      return typeScript;
    }
  );
};

const generateDatasetTypeFromFields = <T>(
  fields: IDataGovDatasetTableSchemaField<T>[],
  interfaceName: string
) => {
  const properties = fields.map((field) =>
    generateDatasetTypeFromFieldsItem(field)
  );

  const typeScript = [
    `export interface ${interfaceName}`,
    `{`,
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

  return [jsDoc, `${key}: ${type};`, ``].join(`\n\t`);
};

const generateDatasetTypeFromFieldsItemJsDoc = <T>(
  field: IDataGovDatasetTableSchemaField<T>
) => {
  const key = field.name.toString();
  const jsDocLineSeparator = `\n\t * `;

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

  return [`\t/**`, jsDocBody, ` */`].join(`\n\t`);
};
