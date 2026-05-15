import { isFunction, isNonNullable, isPlainObject } from '../_util/is';
export const getColumnKey = (column, defaultKey) => {
  if ('key' in column && isNonNullable(column.key)) {
    return column.key;
  }
  if (column.dataIndex) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : column.dataIndex;
  }
  return defaultKey;
};
export function getColumnPos(index, pos) {
  return pos ? `${pos}-${index}` : `${index}`;
}
export const renderColumnTitle = (title, props) => {
  if (isFunction(title)) {
    return title(props);
  }
  return title;
};
/**
 * Safe get column title
 *
 * Should filter object
 *
 * @param title
 */
export const safeColumnTitle = (title, props) => {
  const result = renderColumnTitle(title, props);
  if (isPlainObject(result) || Array.isArray(result)) {
    return '';
  }
  return result;
};