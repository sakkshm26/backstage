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

import { JsonValue, JsonObject } from '@backstage/types';
import {
  TaskSpec,
  TaskStep,
  TemplateMetadata,
  TaskSpecV1beta2,
  TaskSpecV1beta3,
} from '@backstage/plugin-scaffolder-common';

export type {
  TaskSpec,
  TaskStep,
  TemplateMetadata,
  TaskSpecV1beta2,
  TaskSpecV1beta3,
};

/**
 * The status of each step of the Task
 *
 * @public
 */
export type TaskStatus =
  | 'open'
  | 'processing'
  | 'failed'
  | 'cancelled'
  | 'completed';

/**
 * The status of each step of the Task
 *
 * @public
 * @deprecated use TaskStatus instead
 */
export type Status = TaskStatus;

/**
 * The state of a completed task.
 *
 * @public
 */
export type TaskCompletionState = 'failed' | 'completed';

/**
 * The state of a completed task.
 *
 * @public
 * @deprecated use TaskCompletionState instead
 */
export type CompletedTaskState = TaskCompletionState;

/**
 * SerializedTask
 *
 * @public
 */
export type SerializedTask = {
  id: string;
  spec: TaskSpec;
  status: TaskStatus;
  createdAt: string;
  lastHeartbeatAt?: string;
  secrets?: TaskSecrets;
};

/**
 * TaskEventType
 *
 * @public
 */
export type TaskEventType = 'completion' | 'log';

/**
 * SerializedTaskEvent
 *
 * @public
 */
export type SerializedTaskEvent = {
  id: number;
  taskId: string;
  body: JsonObject;
  type: TaskEventType;
  createdAt: string;
};

/**
 * TaskSecrets
 *
 * @public
 */
export type TaskSecrets = Record<string, string> & {
  backstageToken?: string;
};

/**
 * The result of {@link TaskBroker.dispatch}
 *
 * @public
 */
export type TaskBrokerDispatchResult = {
  taskId: string;
};

/**
 * The options passed to {@link TaskBroker.dispatch}
 * Currently a spec and optional secrets
 *
 * @public
 */
export type TaskBrokerDispatchOptions = {
  spec: TaskSpec;
  secrets?: TaskSecrets;
};

/**
 * DispatchResult
 *
 * @public
 * @deprecated use TaskBrokerDispatchResult instead
 */
export type DispatchResult = TaskBrokerDispatchResult;

/**
 * Task
 *
 * @public
 */
export interface TaskContext {
  spec: TaskSpec;
  secrets?: TaskSecrets;
  done: boolean;
  emitLog(message: string, logMetadata?: JsonObject): Promise<void>;
  complete(result: TaskCompletionState, metadata?: JsonObject): Promise<void>;
  getWorkspaceName(): Promise<string>;
}

/**
 * TaskBroker
 *
 * @public
 */
export interface TaskBroker {
  claim(): Promise<TaskContext>;
  dispatch(
    options: TaskBrokerDispatchOptions,
  ): Promise<TaskBrokerDispatchResult>;
  vacuumTasks(options: { timeoutS: number }): Promise<void>;
  observe(
    options: {
      taskId: string;
      after: number | undefined;
    },
    callback: (
      error: Error | undefined,
      result: { events: SerializedTaskEvent[] },
    ) => void,
  ): { unsubscribe: () => void };
  get(taskId: string): Promise<SerializedTask>;
}

/**
 * TaskStoreEmitOptions
 *
 * @public
 */
export type TaskStoreEmitOptions = {
  taskId: string;
  body: JsonObject;
};

/**
 * TaskStoreListEventsOptions
 *
 * @public
 */
export type TaskStoreListEventsOptions = {
  taskId: string;
  after?: number | undefined;
};

/**
 * The options passed to {@link TaskStore.createTask}
 * @public
 */
export type TaskStoreCreateTaskOptions = {
  spec: TaskSpec;
  secrets?: TaskSecrets;
};

/**
 * The response from {@link TaskStore.createTask}
 * @public
 */
export type TaskStoreCreateTaskResult = {
  taskId: string;
};

/**
 * TaskStore
 *
 * @public
 */
export interface TaskStore {
  createTask(
    options: TaskStoreCreateTaskOptions,
  ): Promise<TaskStoreCreateTaskResult>;
  getTask(taskId: string): Promise<SerializedTask>;
  claimTask(): Promise<SerializedTask | undefined>;
  completeTask(options: {
    taskId: string;
    status: TaskStatus;
    eventBody: JsonObject;
  }): Promise<void>;
  heartbeatTask(taskId: string): Promise<void>;
  listStaleTasks(options: { timeoutS: number }): Promise<{
    tasks: { taskId: string }[];
  }>;

  emitLogEvent({ taskId, body }: TaskStoreEmitOptions): Promise<void>;
  listEvents({
    taskId,
    after,
  }: TaskStoreListEventsOptions): Promise<{ events: SerializedTaskEvent[] }>;
}

export type WorkflowResponse = { output: { [key: string]: JsonValue } };
export interface WorkflowRunner {
  execute(task: TaskContext): Promise<WorkflowResponse>;
}
