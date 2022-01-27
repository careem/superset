(function () {var enterModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.enterModule : undefined;enterModule && enterModule(module);})();var __signature__ = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default.signature : function (a) {return a;}; /*
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

import { createSelector } from 'reselect';


export const DEFAULT_MARGIN = { bottom: 16, left: 16, right: 16, top: 16 };

export default function createMarginSelector(
defaultMargin = DEFAULT_MARGIN)
{
  return createSelector(
  (margin) => margin.bottom,
  (margin) => margin.left,
  (margin) => margin.right,
  (margin) => margin.top,
  (
  bottom = defaultMargin.bottom,
  left = defaultMargin.left,
  right = defaultMargin.right,
  top = defaultMargin.top) => (
  {
    bottom,
    left,
    right,
    top }));


};(function () {var reactHotLoader = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.default : undefined;if (!reactHotLoader) {return;}reactHotLoader.register(DEFAULT_MARGIN, "DEFAULT_MARGIN", "/Users/evan/GitHub/superset/superset-frontend/plugins/preset-chart-xy/src/utils/createMarginSelector.tsx");reactHotLoader.register(createMarginSelector, "createMarginSelector", "/Users/evan/GitHub/superset/superset-frontend/plugins/preset-chart-xy/src/utils/createMarginSelector.tsx");})();;(function () {var leaveModule = typeof reactHotLoaderGlobal !== 'undefined' ? reactHotLoaderGlobal.leaveModule : undefined;leaveModule && leaveModule(module);})();