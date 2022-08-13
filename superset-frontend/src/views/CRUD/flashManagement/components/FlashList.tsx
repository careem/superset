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
 import { commonMenuData } from 'src/views/CRUD/data/common';
 import { SavedQueryObject } from 'src/views/CRUD/types';
 import copyTextToClipboard from 'src/utils/copy';
 import { isFeatureEnabled, FeatureFlag } from 'src/featureFlags';
 import ImportModelsModal from 'src/components/ImportModal/index';
 import Icons from 'src/components/Icons';
import { FLASH_TYPES, SCHEDULE_TYPE } from '../constants';
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

 function FlashList({
   addDangerToast,
   addSuccessToast,
 }: FlashListProps) {
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
   } = useFlashListViewResource<SavedQueryObject>(
     'flash',
     t('Flashes'),
     addDangerToast,
   );
   const [queryCurrentlyDeleting, setQueryCurrentlyDeleting] =
     useState<SavedQueryObject | null>(null);
   const [savedQueryCurrentlyPreviewing, setSavedQueryCurrentlyPreviewing] =
     useState<SavedQueryObject | null>(null);
   const [importingSavedQuery, showImportModal] = useState<boolean>(false);
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
    //  ...commonMenuData,
     name: t('Flash')
   };

   const subMenuButtons: Array<ButtonProps> = [];

   if (canDelete) {
     subMenuButtons.push({
       name: t('Bulk select'),
       onClick: toggleBulkSelect,
       buttonStyle: 'secondary',
     });
   }

  //  subMenuButtons.push({
  //    name: (
  //      <>
  //        <i className="fa fa-plus" /> {t('Create Flash Object')}
  //      </>
  //    ),
  //    onClick: openNewQuery,
  //    buttonStyle: 'primary',
  //  });

  //  if (canCreate && isFeatureEnabled(FeatureFlag.VERSIONED_EXPORT)) {
  //    subMenuButtons.push({
  //      name: (
  //        <Tooltip
  //          id="import-tooltip"
  //          title={t('Import queries')}
  //          placement="bottomRight"
  //          data-test="import-tooltip-test"
  //        >
  //          <Icons.Import data-test="import-icon" />
  //        </Tooltip>
  //      ),
  //      buttonStyle: 'link',
  //      onClick: openSavedQueryImportModal,
  //      'data-test': 'import-button',
  //    });
  //  }

   menuData.buttons = subMenuButtons;


   // Action methods
   const openInSqlLab = (id: number) => {
     window.open(`${window.location.origin}/superset/sqllab?savedQueryId=${id}`);
   };

   const copyQueryLink = useCallback(
     (id: number) => {
       copyTextToClipboard(() =>
         Promise.resolve(
           `${window.location.origin}/superset/sqllab?savedQueryId=${id}`,
         ),
       )
         .then(() => {
           addSuccessToast(t('Link Copied!'));
         })
         .catch(() => {
           addDangerToast(t('Sorry, your browser does not support copying.'));
         });
     },
     [addDangerToast, addSuccessToast],
   );

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
        size:'l',
      },
       {
         accessor: 'target_table_name',
         Header: t('Flash Name'),
         size:'l',
       },
       {
         accessor: 'flash_type',
         Header: t('Flash Type'),
         size:'l',

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
      //  {
      //    Cell: ({
      //      row: {
      //        original: { sql_tables: tables = [] },
      //      },
      //    }: any) => {
      //      const names = tables.map((table: any) => table.table);
      //      const main = names?.shift() || '';

      //      if (names.length) {
      //        return (
      //          <StyledTableLabel>
      //            <span>{main}</span>
      //            <Popover
      //              placement="right"
      //              title={t('TABLES')}
      //              trigger="click"
      //              content={
      //                <>
      //                  {names.map((name: string) => (
      //                    <StyledPopoverItem key={name}>{name}</StyledPopoverItem>
      //                  ))}
      //                </>
      //              }
      //            >
      //              <span className="count">(+{names.length})</span>
      //            </Popover>
      //          </StyledTableLabel>
      //        );
      //      }

      //      return main;
      //    },
      //    accessor: 'sql_tables',
      //    Header: t('Tables'),
      //    size: 'xl',
      //    disableSortBy: true,
      //  },
       {
        //  Cell: ({
        //    row: {
        //      original: { created_on: createdOn },
        //    },
        //  }: any) => {
        //    const date = new Date(createdOn);
        //    const utc = new Date(
        //      Date.UTC(
        //        date.getFullYear(),
        //        date.getMonth(),
        //        date.getDate(),
        //        date.getHours(),
        //        date.getMinutes(),
        //        date.getSeconds(),
        //        date.getMilliseconds(),
        //      ),
        //    );

        //    return moment(utc).fromNow();
        //  },
         Header: t('Slack Channel'),
         accessor: 'slack_channel',
         size:'xl'
       },
       {
        //  Cell: ({
        //    row: {
        //      original: { changed_on_delta_humanized: changedOn },
        //    },
        //  }: any) => changedOn,
         Header: t('Slack Handle'),
         accessor: 'slack_handle',
         size:'xl'
       },
       {
        //  Cell: ({
        //    row: {
        //      original: { changed_on_delta_humanized: changedOn },
        //    },
        //  }: any) => changedOn,
         Header: t('Status'),
         accessor: 'status',
         size:'l'
       },
       {
         Cell: ({ row: { original } }: any) => {
           const handlePreview = () => {
             handleSavedQueryPreview(original.id);
           };
           const handleEdit = () => openInSqlLab(original.id);
           const handleCopy = () => copyQueryLink(original.id);
           const handleExport = () => handleBulkSavedQueryExport([original]);
           const handleDelete = () => setQueryCurrentlyDeleting(original);

           const actions = [
            //  {
            //    label: 'preview-action',
            //    tooltip: t('Query preview'),
            //    placement: 'bottom',
            //    icon: 'Binoculars',
            //    onClick: handlePreview,
            //  },
            //  canEdit && {
            //    label: 'edit-action',
            //    tooltip: t('Edit query'),
            //    placement: 'bottom',
            //    icon: 'Edit',
            //    onClick: handleEdit,
            //  },
             {
               label: 'ownership-action',
               tooltip: t('Change Ownership'),
               placement: 'bottom',
               icon: 'SwitchUser',
              //  viewBox: '0 0 1024 1024',
               onClick: handleCopy,
             },
             {
              label: 'copy-action',
              tooltip: t('Change Costing Attributes'),
              placement: 'bottom',
              icon: 'Edit',
              onClick: handleCopy,
            },
             canExport && {
               label: 'export-action',
               tooltip: t('Extend TTL'),
               placement: 'bottom',
               icon: 'Share',
               onClick: handleExport,
             },
             canDelete && {
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
     [canDelete, canEdit, canExport, copyQueryLink, handleSavedQueryPreview],
   );

   const filters: Filters = useMemo(
     () => [
      {
        Header: t('Database Name'),
        id: 'target_db_name',
        input: 'select',
        operator: FilterOperator.relationOneMany,
        unfilteredLabel: 'All',
        fetchSelects: createFetchRelated(
          'saved_query',
          'database',
          createErrorHandler(errMsg =>
            addDangerToast(
              t(
                'An error occurred while fetching flash names: %s',
                errMsg,
              ),
            ),
          ),
        ),
        paginate: true,
      },
       {
         Header: t('Flash Name'),
         id: 'target_table_name',
         input: 'select',
         operator: FilterOperator.relationOneMany,
         unfilteredLabel: 'All',
         fetchSelects: createFetchRelated(
           'saved_query',
           'database',
           createErrorHandler(errMsg =>
             addDangerToast(
               t(
                 'An error occurred while fetching flash names: %s',
                 errMsg,
               ),
             ),
           ),
         ),
         paginate: true,
       },
       {
         Header: t('Flash Type'),
         id: 'flash_type',
         input: 'select',
         operator: FilterOperator.equals,
         unfilteredLabel: 'All',
         selects: FLASH_TYPES,
         paginate: true,
       },
       {
        Header: t('TTL'),
        id: 'ttl',
        input: 'datetime_range',
      },
       {
        Header: t('Schedule Type'),
        id: 'schedule_type',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        selects:SCHEDULE_TYPE,
        paginate: true,
      },
      {
        Header: t('Status'),
        id: 'status',
        input: 'select',
        operator: FilterOperator.equals,
        unfilteredLabel: 'All',
        fetchSelects: createFetchDistinct(
          'saved_query',
          'schema',
          createErrorHandler(errMsg =>
            addDangerToast(
              t('An error occurred while fetching status: %s', errMsg),
            ),
          ),
        ),
        paginate: true,
      },
       {
         Header: t('Search'),
         id: 'target_table_name',
         input: 'search',
         operator: FilterOperator.allText,
       },
     ],
     [addDangerToast],
   );

   return (
     <>
       <SubMenu  {...menuData} />
       {queryCurrentlyDeleting && (
         <DeleteModal
           description={t(
             'This action will permanently delete the saved query.',
           )}
           onConfirm={() => {
             if (queryCurrentlyDeleting) {
               handleQueryDelete(queryCurrentlyDeleting);
             }
           }}
           onHide={() => setQueryCurrentlyDeleting(null)}
           open
           title={t('Delete Query?')}
         />
       )}
       {/* {savedQueryCurrentlyPreviewing && (
         <SavedQueryPreviewModal
           fetchData={handleSavedQueryPreview}
           onHide={() => setSavedQueryCurrentlyPreviewing(null)}
           savedQuery={savedQueryCurrentlyPreviewing}
           queries={flashes}
           openInSqlLab={openInSqlLab}
           show
         />
       )} */}
       <ConfirmStatusChange
         title={t('Please confirm')}
         description={t('Are you sure you want to delete the selected flash?')}
         onConfirm={handleBulkQueryDelete}
       >
         {confirmDelete => {
           const bulkActions: ListViewProps['bulkActions'] = [];
           if (canDelete) {
             bulkActions.push({
               key: 'delete',
               name: t('Delete'),
               onSelect: confirmDelete,
               type: 'danger',
             });
           }
          //  if (canExport) {
          //    bulkActions.push({
          //      key: 'export',
          //      name: t('Export'),
          //      type: 'primary',
          //      onSelect: handleBulkSavedQueryExport,
          //    });
          //  }
           return (
             <ListView<SavedQueryObject>
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
       />
       {preparingExport && <Loading />}
     </>
   );
 }

 export default withToasts(FlashList);
