/*
 * Copyright 2020 The Backstage Authors
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

import React, { ReactNode } from 'react';
import { useOutlet } from 'react-router';

import { EntityName } from '@backstage/catalog-model';
import { Page } from '@backstage/core-components';

import { LegacyTechDocsPage } from './LegacyTechDocsPage';
import { TechDocsEntityMetadata, TechDocsMetadata } from '../../../types';
import { TechDocsPageProvider } from './context';

export type TechDocsPageRenderFunction = ({
  techdocsMetadataValue,
  entityMetadataValue,
  entityRef,
}: {
  techdocsMetadataValue?: TechDocsMetadata | undefined;
  entityMetadataValue?: TechDocsEntityMetadata | undefined;
  entityRef: EntityName;
  isReady: boolean;
  onReady: () => void;
}) => JSX.Element;

export type TechDocsPageProps = {
  children?: TechDocsPageRenderFunction | ReactNode;
};

export const TechDocsPage = ({ children }: TechDocsPageProps) => {
  const outlet = useOutlet();

  if (!children) {
    return (
      <TechDocsPageProvider>
        {outlet || <LegacyTechDocsPage />}
      </TechDocsPageProvider>
    );
  }

  return (
    <Page themeId="documentation">
      <TechDocsPageProvider>{children}</TechDocsPageProvider>
    </Page>
  );
};
