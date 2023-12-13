import { toNumber, toString } from 'lodash';
import { type IDataGovDataset } from '../types';

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
