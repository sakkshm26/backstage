/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect } from 'react';

import {
  techdocsStorageApiRef,
  useTechDocsReader,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';

export const SourceTransformer = () => {
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);

  useEffect(() => {
    if (!dom) return;

    const sources = dom.getElementsByTagName('source');

    if (!sources.length) return;

    for (const source of sources) {
      const src = source.getAttribute('src');

      if (!src) continue;

      techdocsStorageApi.getBaseUrl(src, entityName, path).then(baseUrl => {
        source.setAttribute('src', baseUrl);
      });
    }
  }, [dom, path, entityName, techdocsStorageApi]);

  return null;
};
