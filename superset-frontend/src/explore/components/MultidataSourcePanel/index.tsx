import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ColumnMeta,
  ControlConfig,
  DatasourceMeta,
} from '@superset-ui/chart-controls';

import _, { debounce } from 'lodash';
import { matchSorter, rankings } from 'match-sorter';
import { t } from '@superset-ui/core';

import Collapse from 'src/components/Collapse';
import { FAST_DEBOUNCE } from 'src/constants';
import { Input } from 'src/components/Input';
import Control from 'src/explore/components/Control';

import { DndItemType } from '../DndItemType';
import { ExploreActions } from 'src/explore/actions/exploreActions';
import { StyledColumnOption, StyledMetricOption } from '../optionRenderers';
import DatasourcePanelDragOption from '../DatasourcePanel/DatasourcePanelDragOption';

import {
  Button,
  LabelContainer,
  enableExploreDnd,
  ButtonContainer,
  DatasourceContainer,
} from '../DatasourcePanel';

const SMALLCASE_A_ASCII_CODE = 97;

interface DatasourceControl extends ControlConfig {
  datasource?: DatasourceMeta;
}

interface Props {
  datasource: DatasourceMeta;
  controls: {
    datasource: DatasourceControl;
  };
  actions: Partial<ExploreActions> & Pick<ExploreActions, 'setControlValue'>;
  shouldForceUpdate?: number;
}

export default function MultidataSourcePanel({
  actions,
  datasource,
  shouldForceUpdate,
  controls: { datasource: datasourceControl },
}: Props) {
  const { columns: _columns, metrics } = datasource;

  function getTableNames(tableName: string) {
    const tables = tableName.split('__');
    tables.pop();
    tables.shift();
    return tables;
  }

  function getFilteredColumns(columns: ColumnMeta[], columnAlias: string) {
    return columns.filter(column => column.column_name.startsWith(columnAlias));
  }

  const tableNames = getTableNames(datasource.datasource_name || '');

  const tableColumns = {};
  const initialShowColumns = {};

  tableNames.forEach((table, index) => {
    tableColumns[table] = getFilteredColumns(
      _columns,
      String.fromCharCode(SMALLCASE_A_ASCII_CODE + index),
    );
    tableColumns[table] = useMemo(
      () => [...tableColumns[table]].sort(),
      [tableColumns[table]],
    );
    initialShowColumns[table] = false;
  });

  useEffect(() => {
    setList({
      metrics,
      columns: tableColumns,
    });
    setInputValue('');
  }, [_columns, datasource, metrics]);

  const [inputValue, setInputValue] = useState('');
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(initialShowColumns);

  const [lists, setList] = useState({
    metrics,
    columns: tableColumns,
  });

  const DEFAULT_MAX_METRICS_LENGTH = 50;
  const DEFAULT_MAX_COLUMNS_LENGTH = 50;

  const sortCertifiedFirst = (slice: ColumnMeta[]) =>
    slice.sort((a, b) => b.is_certified - a.is_certified);

  const metricSlice = useMemo(
    () =>
      showAllMetrics
        ? lists.metrics
        : lists.metrics.slice(0, DEFAULT_MAX_METRICS_LENGTH),
    [lists.metrics, showAllMetrics],
  );

  const columnSlices = {};

  tableNames.forEach(
    table =>
      (columnSlices[table] = useMemo(
        () =>
          showAllColumns[table]
            ? sortCertifiedFirst(lists.columns[table])
            : sortCertifiedFirst(
                lists.columns[table].slice(0, DEFAULT_MAX_COLUMNS_LENGTH),
              ),
        [lists.columns[table], showAllColumns[table]],
      )),
  );

  function updateShowColumns(tableName: string) {
    const updatedShowColumns = _.cloneDeep(showAllColumns);
    updatedShowColumns[tableName] = !showAllColumns[tableName];
    setShowAllColumns(updatedShowColumns);
  }

  const search = useMemo(
    () =>
      debounce((value: string) => {
        if (value === '') {
          setList({ columns: tableColumns, metrics });
          return;
        }
        const updatedTableColumns = {};
        tableNames.forEach(
          (table, index) =>
            (updatedTableColumns[table] = matchSorter(
              getFilteredColumns(
                _columns,
                String.fromCharCode(SMALLCASE_A_ASCII_CODE + index),
              ),
              value,
              {
                keys: [
                  {
                    key: 'verbose_name',
                    threshold: rankings.CONTAINS,
                  },
                  {
                    key: 'column_name',
                    threshold: rankings.CONTAINS,
                  },
                  {
                    key: item =>
                      [item.description, item.expression].map(
                        x => x?.replace(/[_\n\s]+/g, ' ') || '',
                      ),
                    threshold: rankings.CONTAINS,
                    maxRanking: rankings.CONTAINS,
                  },
                ],
                keepDiacritics: true,
              },
            )),
        );
        setList({
          columns: updatedTableColumns,
          metrics: matchSorter(metrics, value, {
            keys: [
              {
                key: 'verbose_name',
                threshold: rankings.CONTAINS,
              },
              {
                key: 'metric_name',
                threshold: rankings.CONTAINS,
              },
              {
                key: item =>
                  [item.description, item.expression].map(
                    x => x?.replace(/[_\n\s]+/g, ' ') || '',
                  ),
                threshold: rankings.CONTAINS,
                maxRanking: rankings.CONTAINS,
              },
            ],
            keepDiacritics: true,
            baseSort: (a, b) =>
              Number(b.item.is_certified) - Number(a.item.is_certified) ||
              String(a.rankedValue).localeCompare(b.rankedValue),
          }),
        });
      }, FAST_DEBOUNCE),
    [_columns, metrics],
  );

  const mainBody = useMemo(
    () => (
      <>
        <Input
          allowClear
          value={inputValue}
          onChange={evt => {
            setInputValue(evt.target.value);
            search(evt.target.value);
          }}
          className="form-control input-md"
          placeholder={t('Search Metrics & Columns')}
        />
        <div className="field-selections">
          <Collapse
            ghost
            expandIconPosition="right"
            defaultActiveKey={['metrics', 'column']}
          >
            <Collapse.Panel
              key="metrics"
              header={<span className="header">{t('Metrics')}</span>}
            >
              <div className="field-length">
                {t(
                  `Showing %s of %s`,
                  metricSlice.length,
                  lists.metrics.length,
                )}
              </div>
              {metricSlice.map(m => (
                <LabelContainer
                  className="column"
                  key={m.metric_name + String(shouldForceUpdate)}
                >
                  {enableExploreDnd ? (
                    <DatasourcePanelDragOption
                      value={m}
                      type={DndItemType.Metric}
                    />
                  ) : (
                    <StyledMetricOption metric={m} showType />
                  )}
                </LabelContainer>
              ))}
              {lists.metrics.length > DEFAULT_MAX_METRICS_LENGTH ? (
                <ButtonContainer>
                  <Button onClick={() => setShowAllMetrics(!showAllMetrics)}>
                    {showAllMetrics ? t('Show less...') : t('Show all...')}
                  </Button>
                </ButtonContainer>
              ) : (
                <></>
              )}
            </Collapse.Panel>
            <Collapse.Panel
              key="column"
              header={<span className="header">{t('Columns')}</span>}
            >
              <Collapse
                ghost
                bordered
                defaultActiveKey={Object.keys(lists.columns)}
                expandIconPosition="right"
              >
                {tableNames.map(table => (
                  <Collapse.Panel
                    key={table}
                    header={
                      <span className="header">{t(`${table} columns`)}</span>
                    }
                  >
                    <div className="field-length">
                      {t(
                        `Showing %s of %s`,
                        columnSlices[table].length,
                        lists.columns[table].length,
                      )}
                    </div>
                    {columnSlices[table].map(col => (
                      <LabelContainer
                        key={col.column_name + String(shouldForceUpdate)}
                        className="column"
                      >
                        {enableExploreDnd ? (
                          <DatasourcePanelDragOption
                            value={col}
                            type={DndItemType.Column}
                          />
                        ) : (
                          <StyledColumnOption
                            column={{
                              ...col,
                              temp_name: col.column_name.substring(2),
                            }}
                            showType
                          />
                        )}
                      </LabelContainer>
                    ))}
                    {lists.columns[table].length >
                    DEFAULT_MAX_COLUMNS_LENGTH ? (
                      <ButtonContainer>
                        <Button onClick={() => updateShowColumns(table)}>
                          {showAllColumns[table]
                            ? t('Show Less...')
                            : t('Show all...')}
                        </Button>
                      </ButtonContainer>
                    ) : (
                      <></>
                    )}
                  </Collapse.Panel>
                ))}
              </Collapse>
            </Collapse.Panel>
          </Collapse>
        </div>
      </>
    ),
    [
      inputValue,
      metricSlice,
      columnSlices,
      lists.columns,
      showAllColumns,
      showAllMetrics,
      shouldForceUpdate,
      lists.metrics.length,
    ],
  );

  return (
    <DatasourceContainer>
      <Control {...datasourceControl} name="datasource" actions={actions} />
      {datasource.id != null && mainBody}
    </DatasourceContainer>
  );
}
