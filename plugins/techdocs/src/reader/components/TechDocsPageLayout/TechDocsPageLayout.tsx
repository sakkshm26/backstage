/*
 * Copyright 2022 The Backstage Authors
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

import React, { PropsWithChildren } from 'react';

import { Page, Content } from '@backstage/core-components';

import { Reader } from '../Reader';
import { useTechDocsPage } from '../TechDocsPage';
import { TechDocsPageHeader } from '../TechDocsPageHeader';

export const TechDocsPageLayout = ({ children }: PropsWithChildren<{}>) => {
  const {
    isReady,
    onReady,
    entityRef,
    entityMetadataValue: entityMetadata,
    techdocsMetadataValue: techDocsMetadata,
  } = useTechDocsPage();

  return (
    <Page themeId="documentation">
      <TechDocsPageHeader
        entityRef={entityRef}
        entityMetadata={entityMetadata}
        techDocsMetadata={techDocsMetadata}
      />
      <Content data-testid="techdocs-content">
        <Reader entityRef={entityRef} isReady={isReady} onReady={onReady}>
          {children}
        </Reader>
      </Content>
    </Page>
  );
};
