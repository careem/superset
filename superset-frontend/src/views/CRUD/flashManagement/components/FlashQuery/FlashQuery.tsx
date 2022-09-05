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
import React, { FunctionComponent, useState, useCallback } from 'react';
import { t, styled } from '@superset-ui/core';
import Button from 'src/components/Button';
import {
  FlashServiceObject,
  FlashUpdateQuery,
} from 'src/views/CRUD/FlashManagement/types';
import Modal from 'src/components/Modal';
import { updateFlash } from '../../services/flash.service';
import { createErrorHandler } from 'src/views/CRUD/utils';
import {
  addDangerToast,
  addSuccessToast,
} from 'src/components/MessageToasts/actions';
import Editor from '@monaco-editor/react';
import { UPDATE_TYPES } from '../../constants';

interface FlashQueryButtonProps {
  flash: FlashServiceObject;
  show: boolean;
  onHide: () => void;
  refreshData: () => void;
}

const StyledModal = styled(Modal)`
  .ant-modal-content {
  }

  .ant-modal-body {
    padding: 24px;
  }

  pre {
    font-size: ${({ theme }) => theme.typography.sizes.xs}px;
    font-weight: ${({ theme }) => theme.typography.weights.normal};
    line-height: ${({ theme }) => theme.typography.sizes.l}px;
    height: 375px;
    border: none;
  }
`;

const FlashQuery: FunctionComponent<FlashQueryButtonProps> = ({
  flash,
  onHide,
  show,
  refreshData,
}) => {
  const [formData, setFormData] = useState<FlashUpdateQuery>({
    sqlQuery: flash?.sqlQuery,
  });

  const handleEditorChange = (value: string) => {
    let formValues = { ...formData };
    formValues.sqlQuery = value ? value : flash?.sqlQuery;
    setFormData(formValues);
  };

  const handleEditorValidation = (markers: any) => {
    markers.forEach((marker: any) =>
      console.log('onValidate:', marker.message),
    );
  };

  const onFlashUpdation = (formData: FlashUpdateQuery) => {
    const payload = { ...formData };
    flashSqlQueryService(Number(flash?.id), UPDATE_TYPES.SQL, payload);
    onHide();
  };

  const flashSqlQueryService = useCallback(
    (id, type, payload) => {
      updateFlash(id, type, payload).then(
        () => {
          addSuccessToast(
            t(
              'Your flash object ownership has been changed. To see details of your flash, navigate to Flash Management',
            ),
          );
          refreshData();
        },
        createErrorHandler(errMsg =>
          addDangerToast(
            t(
              'There was an issue changing the ownership of the Flash %s',
              errMsg,
            ),
          ),
        ),
      );
    },
    [addSuccessToast, addDangerToast],
  );
  const renderModalBody = () => (
    <div>
      <Editor
        height="40vh"
        defaultLanguage="sql"
        defaultValue={flash?.sqlQuery}
        value={formData?.sqlQuery}
        onChange={handleEditorChange}
        onValidate={handleEditorValidation}
        saveViewState
      />
    </div>
  );

  return (
    <div role="none">
      <StyledModal
        onHide={onHide}
        show={show}
        title={t('Update SQL Query')}
        footer={
          <>
            <Button
              data-test="sql-query-update"
              key="sql-query-update"
              buttonStyle="primary"
              onClick={() => onFlashUpdation(formData)}
            >
              {t('Update')}
            </Button>
          </>
        }
      >
        {renderModalBody()}
      </StyledModal>
    </div>
  );
};

export default FlashQuery;
