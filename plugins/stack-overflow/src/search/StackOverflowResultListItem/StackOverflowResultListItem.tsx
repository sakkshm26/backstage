/*
 * Copyright 2022 Spotify AB
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

import React from 'react';
import _unescape from 'lodash/unescape';
import { Link } from '@backstage/core-components';
import { Divider, ListItem, ListItemText } from '@material-ui/core';

type StackOverflowResultListItemProps = {
  result: any; // TODO(emmaindal): type to StackOverflowDocument.
};

export const StackOverflowResultListItem = (props: StackOverflowResultListItemProps) => {
  const { location, title, text } = props.result;

  return (
    <Link to={location} target="_blank">
      <ListItem alignItems="center">
        <ListItemText
          primaryTypographyProps={{ variant: 'h6' }}
          primary={_unescape(title)}
          secondary={text && `Author: ${text}`}
        />
      </ListItem>
      <Divider component="li" />
    </Link>
  );
};
