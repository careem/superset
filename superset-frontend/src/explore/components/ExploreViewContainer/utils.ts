import { DatasourceMeta } from '@superset-ui/chart-controls';

export const MULTI_DATASET_JOIN_KEY = 'multi_table_name';

export function isMultiDatasource(datasource: DatasourceMeta) {
  return datasource.extra
    ? !!JSON.parse(datasource.extra)[MULTI_DATASET_JOIN_KEY]
    : false;
}
