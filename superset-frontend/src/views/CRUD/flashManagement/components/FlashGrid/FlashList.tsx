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

import { SupersetClient, t } from '@superset-ui/core';
import React, { useState, useMemo, useCallback } from 'react';
import rison from 'rison';
import { createErrorHandler } from 'src/views/CRUD/utils';
import withToasts from 'src/components/MessageToasts/withToasts';
import { useFlashListViewResource } from 'src/views/CRUD/hooks';
import ConfirmStatusChange from 'src/components/ConfirmStatusChange';
import SubMenu, {
  SubMenuProps,
  ButtonProps,
} from 'src/views/components/SubMenu';
import ListView, {
  ListViewProps,
  Filters,
  FilterOperator,
} from 'src/components/ListView';
import DeleteModal from 'src/components/DeleteModal';
import ActionsBar, { ActionProps } from 'src/components/ListView/ActionsBar';
import { SavedQueryObject } from 'src/views/CRUD/types';
import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
import {
  DATABASES,
  FLASH_STATUS,
  FLASH_TYPES,
  SCHEDULE_TYPE,
} from '../../constants';
import { FlashServiceObject } from '../../types';
import FlashOwnership from '../FlashOwnership/FlashOwnership';
import FlashExtendTTL from '../FlashExtendTTl/FlashExtendTTl';
import FlashSchedule from '../FlashSchedule/FlashSchedule';
import { removeFlash } from '../../services/flash.service';

const PAGE_SIZE = 1;

interface FlashListProps {
  addDangerToast: (msg: string) => void;
  addSuccessToast: (msg: string) => void;
  user: {
    userId: string | number;
  };
}

function FlashList({ addDangerToast, addSuccessToast }: FlashListProps) {
  const {
    state: {
      loading,
      resourceCount: flashCount,
      resourceCollection: flashes,
      bulkSelectEnabled,
    },
    hasPerm,
    fetchData,
    toggleBulkSelect,
    refreshData,
  } = useFlashListViewResource<FlashServiceObject>(
    'flashes',
    t('Flashes'),
    addDangerToast,
  );
  const [deleteFlash, setDeleteFlash] = useState<FlashServiceObject | null>(
    null,
  );
  const [savedQueryCurrentlyPreviewing, setSavedQueryCurrentlyPreviewing] =
    useState<SavedQueryObject | null>(null);
  const [currentFlash, setCurrentFlash] = useState<FlashServiceObject | {}>({});
  const [showFlashOwnership, setShowFlashOwnership] = useState<boolean>(false);
  const [showFlashTtl, setShowFlashTtl] = useState<boolean>(false);
  const [showFlashSchedule, setShowFlashSchedule] = useState<boolean>(false);

  const canCreate = hasPerm('can_write');
  const canEdit = hasPerm('can_write');
  const canDelete = hasPerm('can_write');
  const canExport =
    hasPerm('can_export') && isFeatureEnabled(FeatureFlag.VERSIONED_EXPORT);

  const handleSavedQueryPreview = useCallback(
    (id: number) => {
      SupersetClient.get({
        endpoint: `/api/v1/saved_query/${id}`,
      }).then(
        ({ json = {} }) => {
          setSavedQueryCurrentlyPreviewing({ ...json.result });
        },
        createErrorHandler(errMsg =>
          addDangerToast(
            t('There was an issue previewing the selected query %s', errMsg),
          ),
        ),
      );
    },
    [addDangerToast],
  );

  const menuData: SubMenuProps = {
    name: t('Flash'),
  };

  const subMenuButtons: Array<ButtonProps> = [];

  //  if (canDelete) {
  subMenuButtons.push({
    name: t('Bulk select'),
    onClick: toggleBulkSelect,
    buttonStyle: 'secondary',
  });
  //  }
  menuData.buttons = subMenuButtons;

  const changeOwnership = (flash: FlashServiceObject) => {
    setCurrentFlash(flash);
    setShowFlashOwnership(true);
  };

  const changeTtl = (flash: FlashServiceObject) => {
    setCurrentFlash(flash);
    setShowFlashTtl(true);
  };

  const changeSchedule = (flash: FlashServiceObject) => {
    setCurrentFlash(flash);
    setShowFlashSchedule(true);
  };

  const handleDeleteFlash = (flash: FlashServiceObject) => {
    // deleteFlash(flash?.id).then(
    //   () => {
    //     refreshData();
    //     setDeleteFlash(null);
    //     addSuccessToast(t('Deleted: %s', flash?.target_table_name));
    //   },
    //   createErrorHandler(errMsg =>
    //     addDangerToast(
    //       t(
    //         'There was an issue deleting %s: %s',
    //         flash?.target_table_name,
    //         errMsg,
    //       ),
    //     ),
    //   ),
    // );

    flashDeleteService(flash);
  };

  const flashDeleteService = useCallback(
    flash => {
      removeFlash(flash?.id).then(
        ({ json = {} }) => {
          refreshData();
          setDeleteFlash(null);
          addSuccessToast(t('Deleted: %s', flash?.target_table_name));
        },
        createErrorHandler(errMsg =>
          addDangerToast(
            t(
              'There was an issue deleting %s: %s',
              flash?.target_table_name,
              errMsg,
            ),
          ),
        ),
      );
    },
    [addSuccessToast, addDangerToast],
  );

  const handleBulkQueryDelete = (queriesToDelete: SavedQueryObject[]) => {
    SupersetClient.delete({
      endpoint: `/api/v1/saved_query/?q=${rison.encode(
        queriesToDelete.map(({ id }) => id),
      )}`,
    }).then(
      ({ json = {} }) => {
        refreshData();
        addSuccessToast(json.message);
      },
      createErrorHandler(errMsg =>
        addDangerToast(
          t('There was an issue deleting the selected queries: %s', errMsg),
        ),
      ),
    );
  };

  const initialSort = [{ id: 'status', desc: true }];
  const columns = useMemo(
    () => [
      {
        accessor: 'target_db_name',
        Header: t('Database Name'),
        size: 'l',
      },
      {
        accessor: 'target_table_name',
        Header: t('Flash Name'),
        size: 'l',
      },
      {
        accessor: 'flash_type',
        Header: t('Flash Type'),
        size: 'l',
      },
      {
        accessor: 'ttl',
        Header: t('TTL'),
        disableSortBy: true,
      },
      {
        accessor: 'schedule_type',
        Header: t('Schedule Type'),
        size: 'l',
      },
      {
        Header: t('Slack Channel'),
        accessor: 'team_slack_channel',
        size: 'xl',
      },
      {
        Header: t('Slack Handle'),
        accessor: 'team_slack_handle',
        size: 'xl',
      },
      {
        Header: t('Owner'),
        accessor: 'created_by',
        size: 'l',
      },
      {
        Header: t('Status'),
        accessor: 'status',
        size: 'l',
      },
      {
        Cell: ({ row: { original } }: any) => {
          const handlePreview = () => {
            handleSavedQueryPreview(original.id);
          };
          const handleChangeSchedule = () => changeSchedule(original);
          const handleChangeOwnership = () => changeOwnership(original);
          const handleChangeTtl = () => changeTtl(original);
          const handleDelete = () => setDeleteFlash(original);

          const actions = [
            {
              label: 'export-action',
              tooltip: t('Extend TTL'),
              placement: 'bottom',
              icon: 'Share',
              onClick: handleChangeTtl,
            },
            {
              label: 'ownership-action',
              tooltip: t('Change Ownership'),
              placement: 'bottom',
              icon: 'SwitchUser',
              onClick: handleChangeOwnership,
            },

            {
              label: 'copy-action',
              tooltip: t('Change Schedule'),
              placement: 'bottom',
              icon: 'Calendar',
              onClick: handleChangeSchedule,
            },
            {
              label: 'copy-action',
              tooltip: t('Update Sql Query'),
              placement: 'bottom',
              icon: 'Sql',
              onClick: handleChangeOwnership,
            },
            {
              label: 'copy-action',
              tooltip: t('Change Costing Attributes'),
              placement: 'bottom',
              icon: 'Edit',
              onClick: handleChangeOwnership,
            },
            {
              label: 'delete-action',
              tooltip: t('Delete Flash'),
              placement: 'bottom',
              icon: 'Trash',
              onClick: handleDelete,
            },
          ].filter(item => !!item);

          return <ActionsBar actions={actions as ActionProps[]} />;
        },
        Header: t('Actions'),
        id: 'actions',
        disableSortBy: true,
      },
    ],
    [canDelete, canEdit, canExport, handleSavedQueryPreview],
  );

  const filters: Filters = useMemo(
    () => [
      {
        Header: t('Database Name'),
        id: 'target_db_name',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects: DATABASES,
      },
      {
        Header: t('Flash Name'),
        id: 'target_table_name',
        input: 'search',
        operator: FilterOperator.contains,
      },

      {
        Header: t('Flash Type'),
        id: 'flash_type',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects: FLASH_TYPES,
      },
      {
        Header: t('TTL'),
        id: 'ttl',
        input: 'date',
      },
      {
        Header: t('Schedule Type'),
        id: 'schedule_type',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects: SCHEDULE_TYPE,
      },
      {
        Header: t('Owner Name'),
        id: 'created_by',
        input: 'search',
        operator: FilterOperator.contains,
      },
      {
        Header: t('Status'),
        id: 'status',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects: FLASH_STATUS,
      },
    ],
    [addDangerToast],
  );

  return (
    <>
      <SubMenu {...menuData} />

      {showFlashOwnership && (
        <FlashOwnership
          flash={currentFlash as FlashServiceObject}
          show={showFlashOwnership}
          onHide={() => setShowFlashOwnership(false)}
          refreshData={refreshData}
        />
      )}

      {showFlashTtl && (
        <FlashExtendTTL
          flash={currentFlash as FlashServiceObject}
          show={showFlashTtl}
          onHide={() => setShowFlashTtl(false)}
          refreshData={refreshData}
        />
      )}

      {showFlashSchedule && (
        <FlashSchedule
          flash={currentFlash as FlashServiceObject}
          show={showFlashSchedule}
          onHide={() => setShowFlashSchedule(false)}
          refreshData={refreshData}
        />
      )}

      {deleteFlash && (
        <DeleteModal
          description={t(
            'This action will permanently delete the selected flash object.',
          )}
          onConfirm={() => {
            if (deleteFlash) {
              handleDeleteFlash(deleteFlash);
            }
          }}
          onHide={() => setDeleteFlash(null)}
          open
          title={t('Delete Flash Object?')}
        />
      )}

      <ConfirmStatusChange
        title={t('Please confirm')}
        description={t('Are you sure you want to delete the selected flash?')}
        onConfirm={handleBulkQueryDelete}
      >
        {confirmDelete => {
          const bulkActions: ListViewProps['bulkActions'] = [];
          bulkActions.push({
            key: 'delete',
            name: t('Delete'),
            onSelect: confirmDelete,
            type: 'danger',
          });
          return (
            <ListView<FlashServiceObject>
              className="flash-list-view"
              columns={columns}
              count={flashCount}
              data={flashes}
              fetchData={fetchData}
              filters={filters}
              initialSort={initialSort}
              loading={loading}
              pageSize={PAGE_SIZE}
              bulkActions={bulkActions}
              bulkSelectEnabled={bulkSelectEnabled}
              disableBulkSelect={toggleBulkSelect}
              highlightRowId={savedQueryCurrentlyPreviewing?.id}
            />
          );
        }}
      </ConfirmStatusChange>
    </>
  );
}

export default withToasts(FlashList);
