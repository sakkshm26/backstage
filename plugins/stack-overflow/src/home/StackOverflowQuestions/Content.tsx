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

import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Link } from '@backstage/core-components';
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { useAsync } from 'react-use';
import React from 'react';
import { StackOverflowQuestion } from '../../types'

/**
 * A component to display a list of stack overflow questions on the homepage.
 *
 * @public
 */

export const Content = () => {
  const configApi = useApi(configApiRef);
  const baseUrl = configApi.getOptionalString('stackoverflow.baseUrl')

  const { value, loading, error } = useAsync(async (): Promise<StackOverflowQuestion[]> => {
    const response = await fetch(`${baseUrl}/questions?tagged=backstage&site=stackoverflow&pagesize=5`);;
    const data = await response.json();
    return data.items;
  }, []);

  if(loading){
    return <p>loading...</p>
  }

  if(error || !value || !value.length){
    return <p>could not load questions</p>
  }

  const getSecondaryText = (answer_count: Number) => {
    if(answer_count > 1){
      return `${answer_count} answers`
    }
    else {
      return `${answer_count} answer`
    }
  };

  return (
    <List>
      {value.map(question => (
        <ListItem key={question.link}>
          <Link to={question.link}>
            <ListItemText primary={question.title} secondary={getSecondaryText(question.answer_count)}/>
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label="external-link">
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </Link>
        </ListItem>
      ))}
    </List>
  );
};
