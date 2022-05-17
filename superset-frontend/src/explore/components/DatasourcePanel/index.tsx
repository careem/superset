/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, styled, t } from '@superset-ui/core';
import {
  ControlConfig,
  DatasourceMeta,
  ColumnMeta,
} from '@superset-ui/chart-controls';
import { debounce } from 'lodash';
import { matchSorter, rankings } from 'match-sorter';
import Collapse from 'src/components/Collapse';
import { Input } from 'src/components/Input';
import { FAST_DEBOUNCE } from 'src/constants';
import { FeatureFlag, isFeatureEnabled } from 'src/featureFlags';
import { ExploreActions } from 'src/explore/actions/exploreActions';
import Control from 'src/explore/components/Control';
import { UserWithPermissionsAndRoles } from 'src/types/bootstrapTypes';
import DatasourcePanelDragOption from './DatasourcePanelDragOption';
import { DndItemType } from '../DndItemType';
import { StyledColumnOption, StyledMetricOption } from '../optionRenderers';

interface DatasourceControl extends ControlConfig {
  datasource?: DatasourceMeta;
  user: UserWithPermissionsAndRoles;
}

export interface Props {
  datasource: DatasourceMeta;
  controls: {
    datasource: DatasourceControl;
  };
  actions: Partial<ExploreActions> & Pick<ExploreActions, 'setControlValue'>;
  // we use this props control force update when this panel resize
  shouldForceUpdate?: number;
}

export const enableExploreDnd = isFeatureEnabled(
  FeatureFlag.ENABLE_EXPLORE_DRAG_AND_DROP,
);

export const Button = styled.button`
  background: none;
  border: none;
  text-decoration: underline;
  color: ${({ theme }) => theme.colors.primary.dark1};
`;

export const ButtonContainer = styled.div`
  text-align: center;
  padding-top: 2px;
`;

export const DatasourceContainer = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.grayscale.light5};
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    max-height: 100%;
    .ant-collapse {
      height: auto;
    }
    .field-selections {
      padding: 0 0 ${4 * theme.gridUnit}px;
      overflow: auto;
    }
    .field-length {
      margin-bottom: ${theme.gridUnit * 2}px;
      font-size: ${theme.typography.sizes.s}px;
      color: ${theme.colors.grayscale.light1};
    }
    .form-control.input-md {
      width: calc(100% - ${theme.gridUnit * 8}px);
      height: ${theme.gridUnit * 8}px;
      margin: ${theme.gridUnit * 2}px auto;
    }
    .type-label {
      font-size: ${theme.typography.sizes.s}px;
      color: ${theme.colors.grayscale.base};
    }
    .Control {
      padding-bottom: 0;
    }
  `};
`;

const LabelWrapper = styled.div`
  ${({ theme }) => css`
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: ${theme.typography.sizes.s}px;
    background-color: ${theme.colors.grayscale.light4};
    margin: ${theme.gridUnit * 2}px 0;
    border-radius: 4px;
    padding: 0 ${theme.gridUnit}px;

    &:first-of-type {
      margin-top: 0;
    }
    &:last-of-type {
      margin-bottom: 0;
    }

    ${enableExploreDnd &&
    css`
      padding: 0;
      cursor: pointer;
      &:hover {
        background-color: ${theme.colors.grayscale.light3};
      }
    `}

    & > span {
      white-space: nowrap;
    }

    .option-label {
      display: inline;
    }

    .metric-option {
      & > svg {
        min-width: ${theme.gridUnit * 4}px;
      }
      & > .option-label {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `}
`;

const SectionHeader = styled.span`
  ${({ theme }) => css`
    font-size: ${theme.typography.sizes.s}px;
  `}
`;

export const LabelContainer = (props: {
  children: React.ReactElement;
  className: string;
}) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const extendedProps = {
    labelRef,
  };
  return (
    <LabelWrapper className={props.className}>
      {React.cloneElement(props.children, extendedProps)}
    </LabelWrapper>
  );
};

export default function DataSourcePanel({
  datasource,
  controls: { datasource: datasourceControl },
  actions,
  shouldForceUpdate,
}: Props) {
  const { columns: _columns, metrics } = datasource;

  // display temporal column first
  const columns = useMemo(
    () =>
      [..._columns].sort((col1, col2) => {
        if (col1.is_dttm && !col2.is_dttm) {
          return -1;
        }
        if (col2.is_dttm && !col1.is_dttm) {
          return 1;
        }
        return 0;
      }),
    [_columns],
  );

  const [inputValue, setInputValue] = useState('');
  const [lists, setList] = useState({
    columns,
    metrics,
  });
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  const DEFAULT_MAX_COLUMNS_LENGTH = 50;
  const DEFAULT_MAX_METRICS_LENGTH = 50;

  const search = useMemo(
    () =>
      debounce((value: string) => {
        if (value === '') {
          setList({ columns, metrics });
          return;
        }
        setList({
          columns: matchSorter(columns, value, {
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
          }),
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
    [columns, metrics],
  );

  useEffect(() => {
    setList({
      columns,
      metrics,
    });
    setInputValue('');
  }, [columns, datasource, metrics]);

  const sortCertifiedFirst = (slice: ColumnMeta[]) =>
    slice.sort((a, b) => b.is_certified - a.is_certified);

  const metricSlice = useMemo(
    () =>
      showAllMetrics
        ? lists.metrics
        : lists.metrics.slice(0, DEFAULT_MAX_METRICS_LENGTH),
    [lists.metrics, showAllMetrics],
  );
  const columnSlice = useMemo(
    () =>
      showAllColumns
        ? sortCertifiedFirst(lists.columns)
        : sortCertifiedFirst(
            lists.columns.slice(0, DEFAULT_MAX_COLUMNS_LENGTH),
          ),
    [lists.columns, showAllColumns],
  );

  const mainBody = useMemo(
    () => (
      <>
        <Input
          allowClear
          onChange={evt => {
            setInputValue(evt.target.value);
            search(evt.target.value);
          }}
          value={inputValue}
          className="form-control input-md"
          placeholder={t('Search Metrics & Columns')}
        />
        <div className="field-selections">
          <Collapse
            defaultActiveKey={['metrics', 'column']}
            expandIconPosition="right"
            ghost
          >
            <Collapse.Panel
              header={<SectionHeader>{t('Metrics')}</SectionHeader>}
              key="metrics"
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
                  key={m.metric_name + String(shouldForceUpdate)}
                  className="column"
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
              header={<SectionHeader>{t('Columns')}</SectionHeader>}
              key="column"
            >
              <div className="field-length">
                {t(
                  `Showing %s of %s`,
                  columnSlice.length,
                  lists.columns.length,
                )}
              </div>
              {columnSlice.map(col => (
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
                    <StyledColumnOption column={col} showType />
                  )}
                </LabelContainer>
              ))}
              {lists.columns.length > DEFAULT_MAX_COLUMNS_LENGTH ? (
                <ButtonContainer>
                  <Button onClick={() => setShowAllColumns(!showAllColumns)}>
                    {showAllColumns ? t('Show Less...') : t('Show all...')}
                  </Button>
                </ButtonContainer>
              ) : (
                <></>
              )}
            </Collapse.Panel>
          </Collapse>
        </div>
      </>
    ),
    [
      columnSlice,
      inputValue,
      lists.columns.length,
      lists.metrics.length,
      metricSlice,
      search,
      showAllColumns,
      showAllMetrics,
      shouldForceUpdate,
    ],
  );

  return (
    <DatasourceContainer>
      <Control {...datasourceControl} name="datasource" actions={actions} />
      {datasource.id != null && mainBody}
    </DatasourceContainer>
  );
}
