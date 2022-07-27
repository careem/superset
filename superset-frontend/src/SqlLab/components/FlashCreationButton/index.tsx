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
import React, { FunctionComponent, useState, useRef, useEffect } from 'react';
import SchemaForm, { FormProps } from 'react-jsonschema-form';
import { Row, Col } from 'src/components';
import { t, styled, ensureIsArray } from '@superset-ui/core';
import * as chrono from 'chrono-node';
import ModalTrigger, { ModalTriggerRef } from 'src/components/ModalTrigger';
import { Form } from 'src/components/Form';
import Button from 'src/components/Button';
import Icons from 'src/components/Icons';
import { removeUnnecessaryProperties } from 'src/utils/commonHelper';
import { FlashTypes } from './enums';
import Loading from 'src/components/Loading';
import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import { getChartDataRequest } from 'src/components/Chart/chartAction';

const appContainer = document.getElementById('app');
const bootstrapData = JSON.parse(
  appContainer?.getAttribute('data-bootstrap') || '{}',
);
const { user } = JSON.parse(
  appContainer?.getAttribute('data-bootstrap') || '{}',
);

const flashObjectConfig = bootstrapData?.common?.conf?.FLASH_CREATION;

const getJSONSchema = () => {
  const jsonSchema = flashObjectConfig?.JSONSCHEMA;
  return jsonSchema;
};

const getUISchema = () => flashObjectConfig?.UISCHEMA;

type Result = {
  query?: string;
  language?: string;
};
interface FlashCreationButtonProps {
  latestQueryFormData?: object
  sql?: string;
  onCreate?: Function;
}

export const StyledButtonComponent = styled(Button)`
  ${({ theme }) => `
    background: none;
    text-transform: none;
    padding: 0px;
    color: ${theme.colors.grayscale.dark2};
    font-size: 14px;
    font-weight: ${theme.typography.weights.normal};
    &:disabled {
      background: none;
      color: ${theme.colors.grayscale.dark2};
      &:hover {
        background: none;
        color: ${theme.colors.grayscale.dark2};
      }
    }
  `}
`;

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
`;

const FlashCreationButton: FunctionComponent<FlashCreationButtonProps> = ({
  sql,
  latestQueryFormData,
  onCreate = () => {},
}) => {
  const [flashSchema, setFlashSchema] = useState(getJSONSchema());
  const [dbDropdown, setDbDropdown] = useState<Array<string>>([]);
  const [formData, setFormData] = useState({});
  const [sqlQuery, setSqlQuery] = useState<Result>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCreateFlashObject = !!sql || !!latestQueryFormData;
  const saveModal: ModalTriggerRef | null = useRef() as ModalTriggerRef;

  useEffect(() => {
    const newDbDropdown = ['Pinot-flashes', 'Trino', 'Presto'];
    setDbDropdown(newDbDropdown);
  }, []);

  const getSchemas = () => {
    if (flashSchema) {
      const jsonSchema = { ...flashSchema };
      if (jsonSchema) {
        Object.entries(jsonSchema.properties).forEach(
          ([key, value]: [string, any]) => {
            if (key === 'target_db_name') {
              jsonSchema.properties[key] = {
                ...value,
                enum: dbDropdown,
                default: dbDropdown[0]
              };
            }
            if (value.default) {
              if (value.format === 'date-time') {
                jsonSchema.properties[key] = {
                  ...value,
                  default: chrono.parseDate(value.default).toISOString(),
                };
              }
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

  useEffect(() => {
    getSchemas();
  }, [dbDropdown]);

  const loadQueryFromData = (resultType: string) => {
    setIsLoading(true);
    getChartDataRequest({
      formData: latestQueryFormData,
      resultFormat: 'json',
      resultType,
    })
      .then(({ json }) =>
      {
        let query = Object.assign({}, json.result[0])
        setSqlQuery(query);
        setIsLoading(false);
        setError(null);
      })
      .catch(response => {
        getClientErrorObject(response).then(({ error, message }) => {
          setError(
            error ||
              message ||
              response.statusText ||
              t('Sorry, An error occurred'),
          );
          setIsLoading(false);
        });
      });
  };

  useEffect(() => {
    loadQueryFromData('query');
  }, [JSON.stringify(latestQueryFormData)]);


  const transformErrors = (errors: any) =>
  errors.map((error: any) => {
    if (error.name === 'pattern') {
      if (error.property === '.team_slack_channel') {
        error.message = 'Slack Channel must start with #';
      }
      if (error.property === '.team_slack_handle') {
        error.message = 'Slack Handle must start with @';
      }
    }
    return error;
  });

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return <pre>{error}</pre>;
  }

  const onFieldChange = (formValues: any) => {
    const formData = { ...formValues };
    if (formData) {
      if (formData.flash_type === FlashTypes.LONG_TERM) {
        formData.ttl = chrono
          .parseDate('90 days from now')
          .toISOString()
          .split('T')[0];
        formData.schedule_start_time = new Date().toISOString();
      } else if (formData.flash_type === FlashTypes.SHORT_TERM) {
        formData.ttl = chrono
          .parseDate('7 days from now')
          .toISOString()
          .split('T')[0];
        formData.schedule_start_time = new Date().toISOString();
      } else {
        formData.ttl = chrono
          .parseDate('7 days from now')
          .toISOString()
          .split('T')[0];
      }
      if (
        formData.domain_name ||
        formData.service_name ||
        formData.dataset_name
      ) {
        formData.target_table_name = [
          formData.domain_name,
          formData.service_name,
          formData.dataset_name,
        ]
          .filter(val => val != null)
          .join('_');
      }
      setFormData(formData);
    }
  };

  const onFlashCreationSubmit = ({
    formData,
  }: {
    formData: Omit<FormProps<Record<string, any>>, 'schema'>;
  }) => {
    const payload = { ...formData };
    if (payload["flash_type"] === FlashTypes.SHORT_TERM) {
      removeUnnecessaryProperties(payload, [
        'team_slack_channel',
        'team_slack_handle',
      ]);
    }
    if (payload["flash_type"] === FlashTypes.ONE_TIME) {
      removeUnnecessaryProperties(payload, [
        'team_slack_channel',
        'team_slack_handle',
        'schedule_type',
        'schedule_start_time',
      ]);
    }
    console.log('payloads===', payload);
    const flash = {
      created_by: user?.email,
      sql_squery: sql || sqlQuery?.query,
      ...payload,
    };

    console.log('flash===', flash);
    // onCreate(flash);
    saveModal?.current?.close();
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
                Create
              </Button>
            </SchemaForm>
          </StyledJsonSchema>
        </Col>
      </Row>
    </Form>
  );

  return (
    <span className="flashCreationButton">
      <ModalTrigger
        ref={saveModal}
        modalTitle={t('Create Flash Object')}
        modalBody={renderModalBody()}
        disabled={!canCreateFlashObject}
        triggerNode={
          <Button
            tooltip={
              canCreateFlashObject
                ? t('Create the flash object')
                : t(
                    'You must run the query successfully first and then try creating a flash object',
                  )
            }
            disabled={!canCreateFlashObject}
            buttonSize="small"
            buttonStyle="primary"
          >
            <Icons.PlusOutlined iconSize="l" />
            {t('Create Flash Object')}
          </Button>
        }
      />
    </span>
  );
};

export default FlashCreationButton;
