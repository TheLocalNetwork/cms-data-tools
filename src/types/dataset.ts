import {
  type TDataGovEpochDate,
  type TDataGovURI,
  type TDataGovUUID,
  type UnknownObject,
} from './util';

export interface IDataGovDataset<T> {
  meta: IDataGovDatasetMeta<T>;
  data: IDataGovDatasetData[];
}

export type IDataGovDatasetData = string[];

export interface IDataGovDatasetMeta<T> {
  success: boolean;
  datset_uuid: TDataGovUUID;
  headers: keyof T[];
  data_file_name: string;
  data_file_url: string;
  data_file_meta_data: IDataGovDatasetFileMeta<T>;
  total_rows: number;
  offset: number;
  size: number;
  altered: boolean;
}

export interface IDataGovDatasetFileMeta<T> {
  csvFileSize: number;
  csvColumnTypes: IDataGovDatasetFileMetaColumnTypes<T>;
  csvFileSHA1: string;
  csvDisplayFormatting: IDataGovDatasetFileMetaColumnTypesFormatting<T>;
  originalColumnTypes: IDataGovDatasetFileMetaColumnTypes<T>;
  overrideColumnTypes: boolean;
  subtables: { hash: string };
  csvFileModifiedTime: TDataGovEpochDate;
  import_status: string;
  tableSchema: IDataGovDatasetTableSchema<T>;
  _entities: IDataGovDatasetFileMetaEntities;
}
export type IDataGovDatasetFileMetaEntities = Record<
  string,
  Record<TDataGovUUID, IDataGovDatasetFileMetaEntity>
>;
export interface IDataGovDatasetFileMetaEntity {
  uuid: TDataGovUUID;
  jsonapiLink: TDataGovURI;
}

export interface IDataGovDatasetTableSchema<T> {
  descriptor: {
    fields: IDataGovDatasetTableSchemaField<T>[];
  };
  hash: string;
}

export interface IDataGovDatasetTableSchemaField<T> {
  name: keyof T;
  title: keyof T | string;
  source_name: keyof T | string;
  type: string;
  format: string;
  display_format?: IDataGovDatasetTableSchemaFieldDisplayFormat;
}

export interface IDataGovDatasetTableSchemaFieldDisplayFormat
  extends UnknownObject {
  alignment?: string | null;
  formatting?: string | null;
  decimal_places?: string | null;
  thousand_separator?: string | null;
}

export type IDataGovDatasetFileMetaColumnTypes<T> = {
  [k in keyof T]: 'TEXT' | 'NUMERIC';
};

export type IDataGovDatasetFileMetaColumnTypesFormatting<T> = {
  [k in keyof T]: IDataGovDatasetTableSchemaFieldDisplayFormat;
};
