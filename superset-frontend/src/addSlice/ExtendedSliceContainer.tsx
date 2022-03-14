import React from 'react';

import _ from 'lodash';
import rison from 'rison';
import { t, SupersetClient, JsonResponse } from '@superset-ui/core';

import { PlusCircleOutlined } from '@ant-design/icons';
import { Button as DefaultButton, Row, Col } from 'antd';

import { Select } from 'src/components';
import { Steps } from 'src/components';
import Button from 'src/components/Button';
import { FormLabel } from 'src/components/Form';
import { Tooltip } from 'src/components/Tooltip';

import {
  StyledLabel,
  StyledContainer,
  TooltipContent,
} from './AddSliceContainer';

import { notification } from 'antd';

import VizTypeGallery from 'src/explore/components/controls/VizTypeControl/VizTypeGallery';

import {
  List,
  Column,
  Dataset,
  DatasetValue,
  StateDataset,
  DatasourceJoins,
  AdditionalStateDataset,
} from './types';

import DatasetDetails from './DatasetDetails';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';

const JOINS = Object.freeze({
  'LEFT JOIN': 'left join',
  'RIGHT JOIN': 'right join',
  'INNER JOIN': 'inner join',
  'FULL JOIN': 'full join',
});

export type DatasetJoin = {
  first_column: string;
  second_column: string;
};

export type AddSliceContainerProps = {};

export type AddSliceContainerState = {
  loading: boolean;
  visType: string | null;
  first_datasource?: StateDataset;
  datasources_joins: DatasourceJoins[];
  additional_datasources: AdditionalStateDataset[];
};

const SINGLE_DATABASE_TITLE =
  'Please select both a Dataset and a Chart type to proceed';
const DOUBLE_DATABASE_TITLE =
  'Please select multiple Datasets, specify the JOIN on Columns and a Chart type to proceed';

export default class ExtendedSliceContainer extends React.PureComponent<
  AddSliceContainerProps,
  AddSliceContainerState
> {
  sqlEditorRef = React.createRef();
  constructor(props: AddSliceContainerProps) {
    super(props);
    this.state = {
      visType: null,
      loading: false,
      datasources_joins: [],
      additional_datasources: [],
    };
    this.newLabel = this.newLabel.bind(this);
    this.getTitle = this.getTitle.bind(this);
    this.gotoSlice = this.gotoSlice.bind(this);
    this.exploreUrl = this.exploreUrl.bind(this);
    this.customLabel = this.customLabel.bind(this);
    this.isBtnDisabled = this.isBtnDisabled.bind(this);
    this.changeVisType = this.changeVisType.bind(this);
    this.multiFormData = this.multiFormData.bind(this);
    this.isJoinComplete = this.isJoinComplete.bind(this);
    this.singleFormData = this.singleFormData.bind(this);
    this.isPrestoDatabse = this.isPrestoDatabse.bind(this);
    this.loadDatasources = this.loadDatasources.bind(this);
    this.addEmptyDataset = this.addEmptyDataset.bind(this);
    this.loadPrestoDatasources = this.loadPrestoDatasources.bind(this);
    this.changeFirstDatasource = this.changeFirstDatasource.bind(this);
    this.changeDatasourceJoins = this.changeDatasourceJoins.bind(this);
    this.isSecondDatabaseSelected = this.isSecondDatabaseSelected.bind(this);
    this.openNotificationWithIcon = this.openNotificationWithIcon.bind(this);
    this.changeAdditionalDatasource =
      this.changeAdditionalDatasource.bind(this);
  }

  openNotificationWithIcon(message: string) {
    notification['error']({
      message,
    });
  }

  exploreUrl() {
    const second_datasource = this.state.additional_datasources[0];
    const isMulti = !!second_datasource?.value;
    if (isMulti) {
      const endpoint = `/superset/explore/?form_data=${this.multiFormData()}`;
      SupersetClient.post({ endpoint })
        .then(
          (response: JsonResponse) =>
            (window.location.href = `/superset/explore/table/${response.json.datasource_id}`),
        )
        .catch((response: JsonResponse) =>
          getClientErrorObject(response).then(error => {
            const errorMessage = error.errors?.shift()?.message;
            this.setState({ loading: false });
            this.openNotificationWithIcon(errorMessage || '');
          }),
        );
    } else
      window.location.href = `/superset/explore/?form_data=${this.singleFormData()}`;
  }

  singleFormData() {
    return JSON.stringify({
      viz_type: this.state.visType,
      datasource: this.state.first_datasource?.value,
    });
  }

  multiFormData() {
    const { visType, first_datasource } = this.state;
    const { datasources_joins, additional_datasources } = this.state;

    const joins: string[] = [];
    const filteredDatasources: string[] = [];

    additional_datasources.forEach(datasource => {
      if (datasource.value && datasource.join_type) {
        filteredDatasources.push(datasource.value);
        joins.push(datasource?.join_type);
      }
    });

    const filteredJoins = datasources_joins.filter(joins =>
      joins.filter(join => join.first_column && join.second_column),
    );

    return JSON.stringify({
      joins,
      viz_type: visType,
      column_joins: filteredJoins,
      first_datasource: first_datasource?.value,
      additional_datasources: filteredDatasources,
    });
  }

  gotoSlice() {
    this.setState({ loading: true });
    this.exploreUrl();
  }

  addEmptyDataset() {
    this.setState({
      additional_datasources: [{ join_type: 'INNER JOIN' }],
      datasources_joins: [[{ first_column: '', second_column: '' }]],
    });
  }

  changeFirstDatasource(
    { value, label }: { value: string; label: string },
    { schema, table_name, column_names, database_name }: DatasetValue,
  ) {
    this.setState({
      first_datasource: {
        value,
        label,
        schema,
        table_name,
        column_names,
        database_name,
      },
    });
  }

  changeAdditionalDatasource(datasets: AdditionalStateDataset[]) {
    this.setState({ additional_datasources: datasets });
  }

  changeDatasourceJoins(datasourceJoins: DatasourceJoins[]) {
    this.setState({ datasources_joins: datasourceJoins });
  }

  changeVisType(visType: string | null) {
    this.setState({ visType });
  }

  newLabel(item: Dataset) {
    return (
      <Tooltip
        mouseEnterDelay={1}
        placement="right"
        title={
          <TooltipContent hasDescription={!!item.description}>
            <div className="tooltip-header">{item.table_name}</div>
            {item.description && (
              <div className="tooltip-description">{item.description}</div>
            )}
          </TooltipContent>
        }
      >
        <StyledLabel>{item.table_name}</StyledLabel>
      </Tooltip>
    );
  }

  customLabel(value: string) {
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

  loadDatasources(search: string, page: number, pageSize: number) {
    const query = rison.encode({
      page,
      page_size: pageSize,
      order_column: 'table_name',
      columns: [
        'id',
        'schema',
        'table_name',
        'description',
        'datasource_type',
        'columns.column_name',
        'database.database_name',
      ],
      filters: [{ col: 'table_name', opr: 'ct', value: search }],
      order_direction: 'asc',
    });
    return SupersetClient.get({
      endpoint: `/api/v1/dataset/?q=${query}`,
    }).then((response: JsonResponse) => {
      const list: List[] = response.json.result.map((item: Dataset) => ({
        schema: item.schema,
        label: item.table_name,
        table_name: item.table_name,
        customLabel: this.newLabel(item),
        database_name: item.database.database_name,
        value: `${item.id}__${item.datasource_type}`,
        column_names: item.columns.map((column: Column) => column.column_name),
      }));
      return {
        data: list,
        totalCount: response.json.count,
      };
    });
  }

  loadPrestoDatasources(search: string, page: number, pageSize: number) {
    return this.loadDatasources(search, page, pageSize).then(result => ({
      data: result.data.filter(
        dataset =>
          this.isPrestoDatabse(dataset.database_name) &&
          dataset.value !== this.state.first_datasource?.value,
      ),
      totalCount: result.totalCount,
    }));
  }

  isPrestoDatabse(database_name: string | undefined) {
    return _.isEqual(database_name, 'Presto');
  }

  isBtnDisabled() {
    return !(
      this.state.visType &&
      this.state.first_datasource?.value &&
      this.isSecondDatabaseSelected()
    );
  }

  isSecondDatabaseSelected() {
    const { first_datasource, datasources_joins, additional_datasources } =
      this.state;
    if (additional_datasources.length > 0) {
      const second_datasource = additional_datasources[0];
      const { first_column, second_column } = datasources_joins[0][0];
      return second_datasource.value
        ? this.isPrestoDatabse(first_datasource?.database_name)
          ? second_datasource.value && first_column && second_column
          : true
        : true;
    } else return true;
  }

  getTitle() {
    const { first_datasource, additional_datasources } = this.state;
    const second_datasource = additional_datasources[0];
    if (first_datasource)
      return this.isPrestoDatabse(first_datasource.database_name) &&
        second_datasource
        ? DOUBLE_DATABASE_TITLE
        : SINGLE_DATABASE_TITLE;
    else return SINGLE_DATABASE_TITLE;
  }

  isJoinComplete() {
    const { additional_datasources, datasources_joins } = this.state;
    const second_datasource = additional_datasources[0];
    const { first_column, second_column } = datasources_joins[0][0];
    return second_datasource && first_column && second_column
      ? 'finish'
      : 'process';
  }

  render() {
    const { first_datasource, additional_datasources } = this.state;
    const isButtonDisabled = this.isBtnDisabled();
    return (
      <StyledContainer>
        <h3>{t('Create a new chart')}</h3>
        <Steps direction="vertical" size="small">
          <Steps.Step
            title={<FormLabel>{t('Choose a dataset')}</FormLabel>}
            status={this.state.first_datasource?.value ? 'finish' : 'process'}
            description={
              <Row gutter={16} style={{ marginBottom: 8 }} align="middle">
                <Col className="gutter-row" span={7}>
                  <Select
                    autoFocus
                    showSearch
                    ariaLabel={t('Dataset')}
                    name="select-datasource"
                    placeholder={t('Choose a dataset')}
                    options={this.loadDatasources}
                    onChange={this.changeFirstDatasource}
                    value={this.state.first_datasource}
                  />
                </Col>
                {additional_datasources.length === 0 && (
                  <Col className="gutter-row">
                    <Tooltip title="Add Dataset">
                      <DefaultButton
                        type="text"
                        size="small"
                        shape="circle"
                        onClick={this.addEmptyDataset}
                        disabled={!first_datasource?.value}
                        icon={<PlusCircleOutlined />}
                      />
                    </Tooltip>
                  </Col>
                )}
                <Col className="gutter-row">
                  <span>
                    {t(
                      'Instructions to add a dataset are available in the Superset tutorial.',
                    )}
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://superset.apache.org/docs/creating-charts-dashboards/first-dashboard#adding-a-new-table"
                    >
                      <i className="fa fa-external-link" />
                    </a>
                  </span>
                </Col>
              </Row>
            }
          />
          {this.isPrestoDatabse(first_datasource?.database_name) &&
            additional_datasources.length > 0 && (
              <Steps.Step
                status={this.isJoinComplete()}
                title={
                  <FormLabel>
                    {t('Choose dataset(s), JOIN Type and columns')}
                  </FormLabel>
                }
                description={additional_datasources.map(
                  (additional_datasource, index) => (
                    <DatasetDetails
                      key={index}
                      index={index}
                      dataset={additional_datasource}
                      datasets={additional_datasources}
                      datasetOptions={this.loadPrestoDatasources}
                      datasourceJoins={this.state.datasources_joins}
                      joinOptions={Object.keys(JOINS).map((join: string) => ({
                        label: join,
                        value: join,
                        customLabel: this.customLabel(join),
                      }))}
                      firstDatasetName={this.state.first_datasource?.table_name}
                      firstDatasourceColumns={this.state.first_datasource?.column_names.map(
                        column => ({
                          label: column,
                          value: column,
                          customLabel: this.customLabel(column),
                        }),
                      )}
                      changeAdditionalDatasource={
                        this.changeAdditionalDatasource
                      }
                      changeDatasourceJoins={this.changeDatasourceJoins}
                    />
                  ),
                )}
              />
            )}
          <Steps.Step
            title={<FormLabel>{t('Choose chart type')}</FormLabel>}
            status={this.state.visType ? 'finish' : 'process'}
            description={
              <VizTypeGallery
                className="viz-gallery"
                onChange={this.changeVisType}
                selectedViz={this.state.visType}
              />
            }
          />
        </Steps>
        <div className="footer">
          {isButtonDisabled && <span>{t(this.getTitle())}</span>}
          <Button
            buttonStyle="primary"
            onClick={this.gotoSlice}
            disabled={isButtonDisabled}
            loading={this.state.loading}
          >
            {t('Create new chart')}
          </Button>
        </div>
      </StyledContainer>
    );
  }
}
