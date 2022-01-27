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
import React from 'react';
import { t } from '@superset-ui/core';
import {


D3_TIME_FORMAT_DOCS,
emitFilterControl,
sections,
sharedControls } from
'@superset-ui/chart-controls';

import { DEFAULT_FORM_DATA } from '../../types';
import {
legendSection,
richTooltipSection,
showValueSection } from
'../../../controls';import { jsx as ___EmotionJSX } from "@emotion/react";

const {
  logAxis,
  markerEnabled,
  markerSize,
  minorSplitLine,
  rowLimit,
  truncateYAxis,
  yAxisBounds,
  zoomable,
  xAxisLabelRotation } =
DEFAULT_FORM_DATA;
const config = {
  controlPanelSections: [
  sections.legacyTimeseriesTime,
  {
    label: t('Query'),
    expanded: true,
    controlSetRows: [
    ['metrics'],
    ['groupby'],
    ['adhoc_filters'],
    emitFilterControl,
    ['limit'],
    ['timeseries_limit_metric'],
    [
    {
      name: 'order_desc',
      config: {
        type: 'CheckboxControl',
        label: t('Sort Descending'),
        default: true,
        description: t('Whether to sort descending or ascending'),
        visibility: ({ controls }) =>
        Boolean(controls == null ? void 0 : controls.timeseries_limit_metric.value) } }],



    ['row_limit']] },


  sections.advancedAnalyticsControls,
  sections.annotationsAndLayersControls,
  sections.forecastIntervalControls,
  sections.titleControls,
  {
    label: t('Chart Options'),
    expanded: true,
    controlSetRows: [
    ['color_scheme'],
    ...showValueSection,
    [
    {
      name: 'markerEnabled',
      config: {
        type: 'CheckboxControl',
        label: t('Marker'),
        renderTrigger: true,
        default: markerEnabled,
        description: t(
        'Draw a marker on data points. Only applicable for line types.') } }],




    [
    {
      name: 'markerSize',
      config: {
        type: 'SliderControl',
        label: t('Marker Size'),
        renderTrigger: true,
        min: 0,
        max: 100,
        default: markerSize,
        description: t(
        'Size of marker. Also applies to forecast observations.'),

        visibility: ({ controls }) => {var _controls$markerEnabl;return (
            Boolean(controls == null ? void 0 : (_controls$markerEnabl = controls.markerEnabled) == null ? void 0 : _controls$markerEnabl.value));} } }],



    [
    {
      name: 'zoomable',
      config: {
        type: 'CheckboxControl',
        label: t('Data Zoom'),
        default: zoomable,
        renderTrigger: true,
        description: t('Enable data zooming controls') } }],



    ...legendSection,
    [___EmotionJSX("h1", { className: "section-header" }, t('X Axis'))],

    [
    {
      name: 'x_axis_time_format',
      config: {
        ...sharedControls.x_axis_time_format,
        default: 'smart_date',
        description: `${D3_TIME_FORMAT_DOCS}. ${t(
        'When using other than adaptive formatting, labels may overlap.')
        }` } }],



    [
    {
      name: 'xAxisLabelRotation',
      config: {
        type: 'SelectControl',
        freeForm: true,
        clearable: false,
        label: t('Rotate x axis label'),
        choices: [
        [0, '0°'],
        [45, '45°']],

        default: xAxisLabelRotation,
        renderTrigger: true,
        description: t(
        'Input field supports custom rotation. e.g. 30 for 30°') } }],




    // eslint-disable-next-line react/jsx-key
    ...richTooltipSection,
    // eslint-disable-next-line react/jsx-key
    [___EmotionJSX("h1", { className: "section-header" }, t('Y Axis'))],
    ['y_axis_format'],
    [
    {
      name: 'logAxis',
      config: {
        type: 'CheckboxControl',
        label: t('Logarithmic y-axis'),
        renderTrigger: true,
        default: logAxis,
        description: t('Logarithmic y-axis') } }],



    [
    {
      name: 'minorSplitLine',
      config: {
        type: 'CheckboxControl',
        label: t('Minor Split Line'),
        renderTrigger: true,
        default: minorSplitLine,
        description: t('Draw split lines for minor y-axis ticks') } }],



    [
    {
      name: 'truncateYAxis',
      config: {
        type: 'CheckboxControl',
        label: t('Truncate Y Axis'),
        default: truncateYAxis,
        renderTrigger: true,
        description: t(
        'Truncate Y Axis. Can be overridden by specifying a min or max bound.') } }],




    [
    {
      name: 'y_axis_bounds',
      config: {
        type: 'BoundsControl',
        label: t('Y Axis Bounds'),
        renderTrigger: true,
        default: yAxisBounds,
        description: t(
        'Bounds for the Y-axis. When left empty, the bounds are ' +
        'dynamically defined based on the min/max of the data. Note that ' +
        "this feature will only expand the axis range. It won't " +
        "narrow the data's extent."),

        visibility: ({ controls }) => {var _controls$truncateYAx;return (
            Boolean(controls == null ? void 0 : (_controls$truncateYAx = controls.truncateYAxis) == null ? void 0 : _controls$truncateYAx.value));} } }]] }],






  controlOverrides: {
    row_limit: {
      default: rowLimit } } };const _default =




config;export default _default;;(function () {var reactHotLoader = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default : undefined;if (!reactHotLoader) {return;}reactHotLoader.register(logAxis, "logAxis", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(markerEnabled, "markerEnabled", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(markerSize, "markerSize", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(minorSplitLine, "minorSplitLine", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(rowLimit, "rowLimit", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(truncateYAxis, "truncateYAxis", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(yAxisBounds, "yAxisBounds", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(zoomable, "zoomable", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(xAxisLabelRotation, "xAxisLabelRotation", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(config, "config", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");reactHotLoader.register(_default, "default", "/Users/evan/GitHub/superset/superset-frontend/plugins/plugin-chart-echarts/src/Timeseries/Regular/Scatter/controlPanel.tsx");})();;(function () {var leaveModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.leaveModule : undefined;leaveModule && leaveModule(module);})();