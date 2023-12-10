import { deburr } from 'lodash';

export const pathSafeRegex = /[^a-z0-9]/g;
export const repeatDashRegex = /-+/g;

export const makeSafePath = (path: string) => {
  const chunks = path.split(/[/.?&]/g);
  const safePath = chunks.map(makeSafePathChunk).join('_');

  return safePath;
};

export const makeSafePathChunk = (slug: string) =>
  deburr(slug)
    .toLowerCase()
    .replace(pathSafeRegex, '-')
    .replace(repeatDashRegex, '-');
