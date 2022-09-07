import React from 'react';

import _ from 'lodash';
import { t } from '@superset-ui/core';

import { Select } from 'src/components';
import { Button, Col, Row, Tooltip } from 'antd';
import { FormLabel } from 'src/components/Form';

import { AsyncSelect } from 'src/components'
import { StyledLabel, StyledStepDescription, TooltipContent } from './AddSliceContainer';

import {
  DatasetValue,
  DatasourceJoins,
  DatasourceJoin,
  AdditionalStateDataset,
} from './types';

import DatasetJoins from './DatasetJoins';
import { OptionsType } from 'src/components/Select/Select';

import { MinusCircleOutlined } from '@ant-design/icons';
import { OptionsPagePromise } from 'src/components/Select/AsyncSelect';

interface DatasetDetailsProps {
  index: number;
  firstDatasetName: string;
  joinOptions: OptionsType;
  dataset: AdditionalStateDataset;
  datasets: AdditionalStateDataset[];
  datasourceJoins: DatasourceJoins[];
  firstDatasourceColumns: OptionsType;
  datasetOptions: OptionsType | OptionsPagePromise;
  changeDatasourceJoins: (datasourceJoins: DatasourceJoins[]) => void;
  changeAdditionalDatasource: (datasets: AdditionalStateDataset[]) => void;
}

function DatasetDetails({
  index,
  dataset,
  datasets,
  joinOptions,
  datasetOptions,
  datasourceJoins,
  firstDatasetName,
  changeDatasourceJoins,
  firstDatasourceColumns,
  changeAdditionalDatasource,
}: DatasetDetailsProps) {
  function changeDatasource(
    { value, label }: { value: string; label: string },
    { schema, table_name, column_names, database_name }: DatasetValue,
  ) {
    const updatedDataset = {
      value,
      label,
      schema,
      table_name,
      database_name,
      column_names,
      join_type: dataset.join_type,
    };
    const additional_datasources = [...datasets];
    additional_datasources[index] = updatedDataset;
    changeAdditionalDatasource(additional_datasources);
  }

  function customLabel(value: string) {
    return (
      <Tooltip
        mouseEnterDelay={1}
        placement="right"
        title={
          <TooltipContent hasDescription={false}>
            <div className="tooltip-header">{value}</div>
          </TooltipContent>
        }
      >
        <StyledLabel>{value}</StyledLabel>
      </Tooltip>
    );
  }

  function changeJoinType(joinType: string) {
    const additional_datasources = [...datasets];
    additional_datasources[index].join_type = joinType;
    changeAdditionalDatasource(additional_datasources);
  }

  function getFirstColumnOptions() {
    return index === 0
      ? firstDatasourceColumns
      : datasets[index - 1].column_names?.map(column => ({
          value: column,
          label: column,
          customLabel: customLabel(column),
        }));
  }

  function getSecondColumnOptions() {
    return datasets[index].column_names?.map(column => ({
      value: column,
      label: column,
      customLabel: customLabel(column),
    }));
  }

  function getFirstDatasetName() {
    return index === 0 ? firstDatasetName : datasets[index - 1].table_name;
  }

  function getSecondDatasetName() {
    return datasets[index].table_name;
  }

  function isButtonDisabled() {
    const { first_column, second_column } = datasourceJoins[index][0];
    return !(dataset.value && first_column && second_column);
  }

  function changeDatasourceJoin(datasourceJoin: DatasourceJoin[]) {
    const updatedJoins = _.cloneWith(datasourceJoins);
    updatedJoins[index] = datasourceJoin;
    changeDatasourceJoins(updatedJoins);
  }

  function addEmptyDataset() {
    const joins = _.cloneDeep(datasourceJoins);
    joins.push([{ first_column: '', second_column: '' }]);
    changeAdditionalDatasource([...datasets, { join_type: 'INNER JOIN' }]);
    changeDatasourceJoins(joins);
  }

  function removeDataset(index: number) {
    const additional_datasources = [...datasets];
    const joins = _.cloneDeep(datasourceJoins);
    additional_datasources.splice(index, 1);
    joins.splice(index, 1);
    changeAdditionalDatasource(additional_datasources);
    changeDatasourceJoins(joins);
  }

  return (
    <>
      <Col
        span={4}
        offset={1}
        className="gutter-row"
        style={{ marginBottom: 8 }}
      >
        <Select
          showSearch
          options={joinOptions}
          ariaLabel={t('JOIN')}
          name="select-join-type"
          value={dataset.join_type}
          onChange={changeJoinType}
          placeholder={t('Choose a JOIN')}
          header={<FormLabel>{t('JOIN')}</FormLabel>}
        />
      </Col>
      <Row gutter={16} style={{ marginBottom: 8 }} align="middle">
        <Col offset={1} className="gutter-row" span={7}>
          <StyledStepDescription className="dataset">
            <AsyncSelect
              autoFocus
              showSearch
              value={dataset.value}
              ariaLabel={t('Dataset')}
              name="select-datasource"
              options={datasetOptions}
              onChange={changeDatasource}
              placeholder={t('Choose a dataset')}
              optionFilterProps={['id', 'label']}
              header={<FormLabel>{t('Dataset')}</FormLabel>}
            />
          </StyledStepDescription>
        </Col>
        <Tooltip title="Delete Dataset">
          <Button
            type="text"
            size="small"
            shape="circle"
            style={{ marginTop: 20 }}
            icon={<MinusCircleOutlined />}
            onClick={() => removeDataset(index)}
          />
        </Tooltip>
      </Row>
      {dataset.value &&
        datasourceJoins[index].map((datasourceJoin, joinIndex) => (
          <DatasetJoins
            key={joinIndex}
            index={joinIndex}
            datasetJoins={datasourceJoins[index]}
            firstColumn={datasourceJoin.first_column}
            secondColumn={datasourceJoin.second_column}
            changeDatasourceJoin={changeDatasourceJoin}
            firstDatasetName={getFirstDatasetName() || ''}
            secondDatasetName={getSecondDatasetName() || ''}
            firstColumnOptions={getFirstColumnOptions() || []}
            secondColumnOptions={getSecondColumnOptions() || []}
          />
        ))}
      {datasets.length - 1 === index && !isButtonDisabled() && (
        <Row
          gutter={16}
          align="middle"
          style={{ marginTop: 16, marginBottom: 8 }}
        >
          <Col>
            <Button
              size="small"
              shape="round"
              type="primary"
              onClick={addEmptyDataset}
            >
              Add Dataset
            </Button>
          </Col>
        </Row>
      )}
    </>
  );
}

export default DatasetDetails;