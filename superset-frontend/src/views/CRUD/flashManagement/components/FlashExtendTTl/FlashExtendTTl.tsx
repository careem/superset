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
import React, {
  FunctionComponent,
  useState,
  useEffect,
  useCallback,
} from 'react';
import SchemaForm from 'react-jsonschema-form';
import { Row, Col } from 'src/components';
import { t, styled } from '@superset-ui/core';
import * as chrono from 'chrono-node';
import { Form } from 'src/components/Form';
import Button from 'src/components/Button';
import { convertToLocalDateTime } from 'src/utils/commonHelper';
import { FlashObject, FormErrors } from 'src/views/CRUD/FlashManagement/types';
import Modal from 'src/components/Modal';
import { updateUser } from '../../services/flash.service';
import { createErrorHandler } from 'src/views/CRUD/utils';
import {
  addDangerToast,
  addSuccessToast,
} from 'src/components/MessageToasts/actions';

const appContainer = document.getElementById('app');
const bootstrapData = JSON.parse(
  appContainer?.getAttribute('data-bootstrap') || '{}',
);

const { user } = JSON.parse(
  appContainer?.getAttribute('data-bootstrap') || '{}',
);

const flashTTLConf = bootstrapData?.common?.conf?.FLASH_TTL;

const getJSONSchema = () => {
  const jsonSchema = flashTTLConf?.JSONSCHEMA;
  return jsonSchema;
};

const getUISchema = () => flashTTLConf?.UISCHEMA;

interface FlashExtendTTLButtonProps {
  show: boolean;
  onHide: () => void;
}

const StyledJsonSchema = styled.div`
  i.glyphicon {
    display: none;
  }
  .btn-add::after {
    content: '+';
  }
  .array-item-move-up::after {
    content: '↑';
  }
  .array-item-move-down::after {
    content: '↓';
  }
  .array-item-remove::after {
    content: '-';
  }
  .help-block {
    font-size: 12px;
  }
  input::placeholder {
    font-size: 13px
    opacity: 0.7;
  }
`;

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

const FlashExtendTTL: FunctionComponent<FlashExtendTTLButtonProps> = ({
  onHide,
  show,
}) => {
  const [flashSchema, setFlashSchema] = useState(getJSONSchema());

  const [formData, setFormData] = useState<FlashObject | {}>({});

  const getSchemas = () => {
    if (flashSchema) {
      const jsonSchema = { ...flashSchema };
      if (jsonSchema) {
        Object.entries(jsonSchema.properties).forEach(
          ([key, value]: [string, any]) => {
            if (value)
              if (value.default) {
                if (value.format === 'date') {
                  jsonSchema.properties[key] = {
                    ...value,
                    default: chrono
                      .parseDate(value.default)
                      .toISOString()
                      .split('T')[0],
                  };
                }
              }
          },
        );
        setFlashSchema(jsonSchema);
      }
    }
  };

  const transformErrors = (errors: FormErrors[]) =>
    errors.map((error: FormErrors) => {
      const newError = { ...error };
      if (error.name === 'pattern') {
        if (error.property === '.team_slack_channel') {
          newError.message = 'Slack Channel must start with #';
        }
        if (error.property === '.team_slack_handle') {
          newError.message = 'Slack Handle must start with @';
        }
      }
      return newError;
    });

  const onFieldChange = (formValues: any) => {
    const formData = { ...formValues };
    console.log('formData===', formData);
    let jsonSchema = { ...flashSchema };

    if (formData) {
    }
  };

  const onFlashCreationSubmit = ({ formData }: { formData: any }) => {
    const payload = { ...formData };
    console.log('payload ===', payload);
    // flashOwnershipService(payload);

    // saveModal?.current?.close();
  };

  const renderModalBody = () => (
    <Form layout="vertical">
      <Row>
        <Col xs={24}>
          <StyledJsonSchema>
            <SchemaForm
              schema={flashSchema}
              showErrorList={false}
              formData={formData}
              uiSchema={getUISchema()}
              onSubmit={onFlashCreationSubmit}
              transformErrors={transformErrors}
              onChange={e => onFieldChange(e.formData)}
            >
              <Button
                buttonStyle="primary"
                htmlType="submit"
                css={{ float: 'right' }}
              >
                Update
              </Button>
            </SchemaForm>
          </StyledJsonSchema>
        </Col>
      </Row>
    </Form>
  );

  return (
    <div role="none">
      <StyledModal
        onHide={onHide}
        show={show}
        title={t('Update TTL')}
        footer={<></>}
      >
        {renderModalBody()}
      </StyledModal>
    </div>
  );
};

export default FlashExtendTTL;
