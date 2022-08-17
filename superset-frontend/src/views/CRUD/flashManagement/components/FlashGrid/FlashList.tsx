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

import { SupersetClient, t, styled } from '@superset-ui/core';
import React, { useState, useMemo, useCallback } from 'react';
import rison from 'rison';
import moment from 'moment';
import {
  createFetchRelated,
  createFetchDistinct,
  createErrorHandler,
} from 'src/views/CRUD/utils';
import Popover from 'src/components/Popover';
import withToasts from 'src/components/MessageToasts/withToasts';
import { useFlashListViewResource } from 'src/views/CRUD/hooks';
import ConfirmStatusChange from 'src/components/ConfirmStatusChange';
import handleResourceExport from 'src/utils/export';
import SubMenu, {
  SubMenuProps,
  ButtonProps,
} from 'src/views/components/SubMenu';
import ListView, {
  ListViewProps,
  Filters,
  FilterOperator,
} from 'src/components/ListView';
import Loading from 'src/components/Loading';
import DeleteModal from 'src/components/DeleteModal';
import ActionsBar, { ActionProps } from 'src/components/ListView/ActionsBar';
import { Tooltip } from 'src/components/Tooltip';
import { SavedQueryObject } from 'src/views/CRUD/types';
import copyTextToClipboard from 'src/utils/copy';
import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
import ImportModelsModal from 'src/components/ImportModal/index';
import Icons from 'src/components/Icons';
import {
  DATABASES,
  FLASH_STATUS,
  FLASH_TYPES,
  SCHEDULE_TYPE,
} from '../../constants';
import { FlashServiceObject } from '../../types';
import FlashOwnership from '../FlashOwnership/FlashOwnership';
//  import SavedQueryPreviewModal from './SavedQueryPreviewModal';

const PAGE_SIZE = 25;
const PASSWORDS_NEEDED_MESSAGE = t(
  'The passwords for the databases below are needed in order to ' +
    'import them together with the saved queries. Please note that the ' +
    '"Secure Extra" and "Certificate" sections of ' +
    'the database configuration are not present in export files, and ' +
    'should be added manually after the import if they are needed.',
);
const CONFIRM_OVERWRITE_MESSAGE = t(
  'You are importing one or more saved queries that already exist. ' +
    'Overwriting might cause you to lose some of your work. Are you ' +
    'sure you want to overwrite?',
);

interface FlashListProps {
  addDangerToast: (msg: string) => void;
  addSuccessToast: (msg: string) => void;
  user: {
    userId: string | number;
  };
}

const StyledTableLabel = styled.div`
  .count {
    margin-left: 5px;
    color: ${({ theme }) => theme.colors.primary.base};
    text-decoration: underline;
    cursor: pointer;
  }
`;

const StyledPopoverItem = styled.div`
  color: ${({ theme }) => theme.colors.grayscale.dark2};
`;

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
  const [queryCurrentlyDeleting, setQueryCurrentlyDeleting] =
    useState<SavedQueryObject | null>(null);
  const [savedQueryCurrentlyPreviewing, setSavedQueryCurrentlyPreviewing] =
    useState<SavedQueryObject | null>(null);
  const [importingSavedQuery, showImportModal] = useState<boolean>(false);
  const [showFlashOwnership, setShowFlashOwnership] = useState<boolean>(false);
  const [passwordFields, setPasswordFields] = useState<string[]>([]);
  const [preparingExport, setPreparingExport] = useState<boolean>(false);

  const openSavedQueryImportModal = () => {
    showImportModal(true);
  };

  const closeSavedQueryImportModal = () => {
    showImportModal(false);
  };

  const handleSavedQueryImport = () => {
    showImportModal(false);
    refreshData();
    addSuccessToast(t('Query imported'));
  };

  const canCreate = hasPerm('can_write');
  const canEdit = hasPerm('can_write');
  const canDelete = hasPerm('can_write');
  const canExport =
    hasPerm('can_export') && isFeatureEnabled(FeatureFlag.VERSIONED_EXPORT);

  const openNewQuery = () => {
    window.open(`${window.location.origin}/superset/sqllab?new=true`);
  };

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

  // Action methods
  const openInSqlLab = (id: number) => {
    window.open(`${window.location.origin}/superset/sqllab?savedQueryId=${id}`);
  };

  const changeOwnership = (id: number) => {
    setShowFlashOwnership(true);
  };

  const handleQueryDelete = ({ id, label }: SavedQueryObject) => {
    SupersetClient.delete({
      endpoint: `/api/v1/saved_query/${id}`,
    }).then(
      () => {
        refreshData();
        setQueryCurrentlyDeleting(null);
        addSuccessToast(t('Deleted: %s', label));
      },
      createErrorHandler(errMsg =>
        addDangerToast(t('There was an issue deleting %s: %s', label, errMsg)),
      ),
    );
  };

  const handleBulkSavedQueryExport = (
    savedQueriesToExport: SavedQueryObject[],
  ) => {
    const ids = savedQueriesToExport.map(({ id }) => id);
    handleResourceExport('saved_query', ids, () => {
      setPreparingExport(false);
    });
    setPreparingExport(true);
  };

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
          const handleEdit = () => openInSqlLab(original.id);
          const handleChangeOwnership = () => changeOwnership(original.id);
          const handleExport = () => handleBulkSavedQueryExport([original]);
          const handleDelete = () => setQueryCurrentlyDeleting(original);

          const actions = [
            {
              label: 'ownership-action',
              tooltip: t('Change Ownership'),
              placement: 'bottom',
              icon: 'SwitchUser',
              //  viewBox: '0 0 1024 1024',
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
              label: 'export-action',
              tooltip: t('Extend TTL'),
              placement: 'bottom',
              icon: 'Share',
              onClick: handleExport,
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
      {queryCurrentlyDeleting && (
        <DeleteModal
          description={t(
            'This action will permanently delete the selected flash object.',
          )}
          onConfirm={() => {
            if (queryCurrentlyDeleting) {
              handleQueryDelete(queryCurrentlyDeleting);
            }
          }}
          onHide={() => setQueryCurrentlyDeleting(null)}
          open
          title={t('Delete Flash Object?')}
        />
      )}

      {showFlashOwnership && (
        <FlashOwnership
          show={showFlashOwnership}
          onHide={() => setShowFlashOwnership(false)}
        />
      )}

      <ConfirmStatusChange
        title={t('Please confirm')}
        description={t('Are you sure you want to delete the selected flash?')}
        onConfirm={handleBulkQueryDelete}
      >
        {confirmDelete => {
          const bulkActions: ListViewProps['bulkActions'] = [];
          //  if (canDelete) {
          bulkActions.push({
            key: 'delete',
            name: t('Delete'),
            onSelect: confirmDelete,
            type: 'danger',
          });
          //  }
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
      {/*
       <ImportModelsModal
         resourceName="saved_query"
         resourceLabel={t('queries')}
         passwordsNeededMessage={PASSWORDS_NEEDED_MESSAGE}
         confirmOverwriteMessage={CONFIRM_OVERWRITE_MESSAGE}
         addDangerToast={addDangerToast}
         addSuccessToast={addSuccessToast}
         onModelImport={handleSavedQueryImport}
         show={importingSavedQuery}
         onHide={closeSavedQueryImportModal}
         passwordFields={passwordFields}
         setPasswordFields={setPasswordFields}
       /> */}
      {/* {preparingExport && <Loading />} */}
    </>
  );
}

export default withToasts(FlashList);
