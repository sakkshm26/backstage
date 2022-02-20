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

import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { useParams } from 'react-router-dom';
import useAsync from 'react-use/lib/useAsync';
import { EntityName } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { techdocsApiRef } from '../../../api';
import { TechDocsNotFound } from '../TechDocsNotFound';
import { TechDocsEntityMetadata, TechDocsMetadata } from '../../../types';

type TechDocsPageValue = {
  techdocsMetadataValue?: TechDocsMetadata | undefined;
  entityMetadataValue?: TechDocsEntityMetadata | undefined;
  entityRef: EntityName;
  isReady: boolean;
  onReady: () => void;
};

const TechDocsPageContext = createContext<TechDocsPageValue>({
  entityRef: { kind: '', namespace: '', name: '' },
  isReady: false,
  onReady: () => {},
});

export const TechDocsPageProvider = ({ children }: PropsWithChildren<{}>) => {
  const { namespace, kind, name } = useParams();
  const [isReady, setReady] = useState<boolean>(false);

  const techdocsApi = useApi(techdocsApiRef);

  const { value: techdocsMetadataValue } = useAsync(async () => {
    if (isReady) {
      return await techdocsApi.getTechDocsMetadata({ kind, namespace, name });
    }
    return undefined;
  }, [kind, namespace, name, isReady, techdocsApi]);

  const { value: entityMetadataValue, error: entityMetadataError } =
    useAsync(async () => {
      return await techdocsApi.getEntityMetadata({ kind, namespace, name });
    }, [kind, namespace, name, techdocsApi]);

  const onReady = useCallback(() => {
    setReady(true);
  }, [setReady]);

  const value = {
    entityRef: { namespace, kind, name },
    entityMetadataValue,
    techdocsMetadataValue,
    isReady,
    onReady,
  };

  if (entityMetadataError) {
    return <TechDocsNotFound errorMessage={entityMetadataError.message} />;
  }

  return (
    <TechDocsPageContext.Provider value={value}>
      {children instanceof Function ? children(value) : children}
    </TechDocsPageContext.Provider>
  );
};

export const useTechDocsPage = () => useContext(TechDocsPageContext);
