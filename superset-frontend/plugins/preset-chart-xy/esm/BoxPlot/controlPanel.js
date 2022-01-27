(function () {var enterModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.enterModule : undefined;enterModule && enterModule(module);})();var __signature__ = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default.signature : function (a) {return a;}; /**
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
import { t } from '@superset-ui/core';
import {

formatSelectOptions,
sections } from
'@superset-ui/chart-controls';

const config = {
  controlPanelSections: [
  sections.legacyRegularTime,
  {
    label: t('Query'),
    expanded: true,
    controlSetRows: [['metrics'], ['adhoc_filters'], ['groupby'], ['limit']] },

  {
    label: t('Chart Options'),
    expanded: true,
    controlSetRows: [
    ['color_scheme'],
    [
    {
      name: 'whisker_options',
      config: {
        type: 'SelectControl',
        freeForm: true,
        label: t('Whisker/outlier options'),
        default: 'Tukey',
        description: t(
        'Determines how whiskers and outliers are calculated.'),

        choices: formatSelectOptions([
        'Tukey',
        'Min/max (no outliers)',
        '2/98 percentiles',
        '9/91 percentiles']) } },



    {
      name: 'x_ticks_layout',
      config: {
        type: 'SelectControl',
        label: t('X Tick Layout'),
        choices: formatSelectOptions([
        'auto',
        'flat',
        '45°',
        'staggered']),

        default: 'auto',
        clearable: false,
        renderTrigger: true,
        description: t('The way the ticks are laid out on the X-axis') } }]] }] };const _default =








config;export default _default;;(function () {var reactHotLoader = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default : undefined;if (!reactHotLoader) {return;}reactHotLoader.register(config, "config", "/Users/evan/GitHub/superset/superset-frontend/plugins/preset-chart-xy/src/BoxPlot/controlPanel.ts");reactHotLoader.register(_default, "default", "/Users/evan/GitHub/superset/superset-frontend/plugins/preset-chart-xy/src/BoxPlot/controlPanel.ts");})();;(function () {var leaveModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.leaveModule : undefined;leaveModule && leaveModule(module);})();