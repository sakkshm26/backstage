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

import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  techdocsStorageApiRef,
  useTechDocsReader,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';

/** Make sure that the input url always ends with a '/' */
const normalizeUrl = (input: string) => {
  const url = new URL(input);

  if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) {
    url.pathname += '/';
  }

  return url.toString();
};

export const AnchorTransformer = () => {
  const navigate = useNavigate();
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);

  const handler = useCallback(
    (anchor: HTMLAnchorElement) => (event: MouseEvent) => {
      const href = anchor.getAttribute('href');
      const download = anchor.hasAttribute('download');

      const origin = window.location.origin;
      if (!href || !href.startsWith(origin) || download) return;

      event.preventDefault();

      const { pathname, hash } = new URL(href);
      const url = pathname.concat(hash);

      // detect if CTRL or META keys are pressed
      // so that links can be opened in a new tab
      if (event.ctrlKey || event.metaKey) {
        window.open(url, '_blank');
        return;
      }

      navigate(url);
    },
    [navigate],
  );

  useEffect(() => {
    if (!dom) return () => {};

    const anchors = dom.getElementsByTagName('a');

    if (!anchors.length) return () => {};

    for (const anchor of anchors) {
      anchor.addEventListener('click', handler(anchor));

      const url = anchor.getAttribute('href');

      if (!url) continue;

      // if link is external, add target to open in a new window or tab
      if (url.match(/^https?:\/\//i)) {
        anchor.setAttribute('target', '_blank');
      }

      try {
        const base = normalizeUrl(window.location.href);
        const href = new URL(url, base).toString();

        if (anchor.hasAttribute('download')) {
          techdocsStorageApi
            .getBaseUrl(href, entityName, path)
            .then(baseUrl => anchor.setAttribute('href', baseUrl));
        } else {
          anchor.setAttribute('href', href);
        }
      } catch {
        // Non-parseable links should be re-written as plain text.
        anchor.replaceWith(anchor.textContent || url);
      }
    }

    return () => {
      for (const anchor of anchors) {
        anchor.removeEventListener('click', handler(anchor));
      }
    };
  }, [dom, navigate, handler, path, entityName, techdocsStorageApi]);

  return null;
};
