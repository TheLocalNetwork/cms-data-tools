import { type TDataGovUUID } from './util';

export const uuidRegex = /[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}/i;

export const isTDataGovUUID = (uuid: string): uuid is TDataGovUUID =>
  uuidRegex.test(uuid);
