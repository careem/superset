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

 export interface FlashObject {
  id?: number;
  owner: string;
  dataset_name: string;
  domain_name: string;
  flash_type: string;
  schedule_start_time?: string;
  schedule_type?: string;
  service_name: string;
  sql_query: string;
  datastore_id: string;
  table_name: string;
  team_slack_channel?: string;
  team_slack_handle?: string;
  ttl: string;
  c_domain?: string;
  c_service?: string;
}

export interface FlashUpdateOwnership {
  owner: string;
  teamSlackChannel: string;
  teamSlackHandle: string;
}

export interface FlashExtendTtl {
  ttl:string;
}

export interface FlashUpdateQuery {
  sqlQuery:string;
}

export interface FlashUpdateSchedule {
  scheduleType: string;
  scheduleStartTime: string;
}

export type FlashServiceObject = {
  cdomain?: string;
  cservice?: string;
  owner: string;
  datasetName: string;
  domainName: string;
  flashType: string;
  id?: number;
  lastRefreshTime?: string;
  retryCount?: number;
  scheduleStartTime?: string;
  scheduleType?: string;
  serviceName: string;
  sqlQuery: string;
  status?: string;
  datastoreId: string;
  tableName: string;
  teamSlackChannel?: string;
  teamSlackHandle?: string;
  ttl: string;
};

export interface FormErrors {
  message: string;
  name: string;
  params: {
    pattern: string;
  };
  property: string;
  schemaPath: string;
  stack: string;
}

export interface Dropdown {
  enum: Array<string> ;
  enumNames?: Array<string>;
}

export interface FilterDropdown {
  label: string;
  value: string;
}
