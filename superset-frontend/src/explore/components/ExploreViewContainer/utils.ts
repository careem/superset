export function isMultiDatasource(datasetName: string) {
  return datasetName.startsWith('tmp__');
}
