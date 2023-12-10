import { compact, toNumber, toString } from 'lodash';
import { type IDataGovDataset, type TDataGovUUID } from './types';

export const getDatasetUrl = (
  id: TDataGovUUID,
  searchParams?: URLSearchParams
) =>
  compact([
    `data-api/v1/dataset/${id}/data-viewer`,
    searchParams?.toString(),
  ]).join('?');

export const schemaFieldsTypeMap: Record<string, string> = {
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
