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

export const LinkTransformer = () => {
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);

  useEffect(() => {
    if (!dom) return;

    const links = dom.getElementsByTagName('link');

    if (!links.length) return;

    for (const link of links) {
      const href = link.getAttribute('href');

      if (!href) continue;

      techdocsStorageApi.getBaseUrl(href, entityName, path).then(baseUrl => {
        link.setAttribute('href', baseUrl);
      });
    }
  }, [dom, path, entityName, techdocsStorageApi]);

  return null;
};
