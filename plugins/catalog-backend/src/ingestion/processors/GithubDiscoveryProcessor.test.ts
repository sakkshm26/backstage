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

import { getVoidLogger } from '@backstage/backend-common';
import { LocationSpec } from '@backstage/catalog-model';
import { GithubDiscoveryProcessor, parseUrl } from './GithubDiscoveryProcessor';
import { getOrganizationRepositories } from './github';
import { ConfigReader } from '@backstage/config';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';

jest.mock('./github');
const mockGetOrganizationRepositories =
  getOrganizationRepositories as jest.MockedFunction<
    typeof getOrganizationRepositories
  >;

describe('GithubDiscoveryProcessor', () => {
  describe('parseUrl', () => {
    it('parses well formed URLs', () => {
      expect(
        parseUrl('https://github.com/foo/proj/blob/master/catalog.yaml'),
      ).toEqual({
        org: 'foo',
        host: 'github.com',
        repoSearchPath: /^proj$/,
        branch: 'master',
        catalogPath: '/catalog.yaml',
      });
      expect(
        parseUrl('https://github.com/foo/proj*/blob/master/catalog.yaml'),
      ).toEqual({
        org: 'foo',
        host: 'github.com',
        repoSearchPath: /^proj.*$/,
        branch: 'master',
        catalogPath: '/catalog.yaml',
      });
      expect(parseUrl('https://github.com/foo')).toEqual({
        org: 'foo',
        host: 'github.com',
        repoSearchPath: /^.*$/,
        branch: '-',
        catalogPath: '/catalog-info.yaml',
      });
    });

    it('throws on incorrectly formed URLs', () => {
      expect(() => parseUrl('https://github.com')).toThrow();
      expect(() => parseUrl('https://github.com//')).toThrow();
      expect(() => parseUrl('https://github.com//foo')).toThrow();
      expect(() => parseUrl('https://github.com/org/teams')).toThrow();
      expect(() => parseUrl('https://github.com/org//teams')).toThrow();
    });
  });

  describe('reject unrelated entries', () => {
    it('rejects unknown types', async () => {
      const config = new ConfigReader({
        integrations: {
          github: [{ host: 'github.com', token: 'blob' }],
        },
      });
      const integrations = ScmIntegrations.fromConfig(config);
      const githubCredentialsProvider =
        DefaultGithubCredentialsProvider.fromIntegrations(integrations);
      const processor = GithubDiscoveryProcessor.fromConfig(config, {
        logger: getVoidLogger(),
        githubCredentialsProvider,
      });
      const location: LocationSpec = {
        type: 'not-github-discovery',
        target: 'https://github.com',
      };
      await expect(
        processor.readLocation(location, false, () => {}),
      ).resolves.toBeFalsy();
    });

    it('rejects unknown targets', async () => {
      const config = new ConfigReader({
        integrations: {
          github: [
            { host: 'github.com', token: 'blob' },
            { host: 'ghe.example.net', token: 'blob' },
          ],
        },
      });
      const integrations = ScmIntegrations.fromConfig(config);
      const githubCredentialsProvider =
        DefaultGithubCredentialsProvider.fromIntegrations(integrations);
      const processor = GithubDiscoveryProcessor.fromConfig(config, {
        logger: getVoidLogger(),
        githubCredentialsProvider,
      });
      const location: LocationSpec = {
        type: 'github-discovery',
        target: 'https://not.github.com/apa',
      };
      await expect(
        processor.readLocation(location, false, () => {}),
      ).rejects.toThrow(
        /There is no GitHub integration that matches https:\/\/not.github.com\/apa/,
      );
    });
  });

  describe('handles repositories', () => {
    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'github.com', token: 'blob' }],
      },
    });
    const integrations = ScmIntegrations.fromConfig(config);
    const githubCredentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(integrations);
    const processor = GithubDiscoveryProcessor.fromConfig(config, {
      logger: getVoidLogger(),
      githubCredentialsProvider,
    });

    beforeEach(() => {
      mockGetOrganizationRepositories.mockClear();
    });

    it('output all repositories', async () => {
      const location: LocationSpec = {
        type: 'github-discovery',
        target: 'https://github.com/backstage/*/blob/master/catalog.yaml',
      };
      mockGetOrganizationRepositories.mockResolvedValueOnce({
        repositories: [
          {
            name: 'backstage',
            url: 'https://github.com/backstage/backstage',
            isArchived: false,
            defaultBranchRef: {
              name: 'master',
            },
          },
          {
            name: 'demo',
            url: 'https://github.com/backstage/demo',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
        ],
      });
      const emitter = jest.fn();

      await processor.readLocation(location, false, emitter);

      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target:
            'https://github.com/backstage/backstage/blob/master/catalog.yaml',
          presence: 'optional',
        },
      });
      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target: 'https://github.com/backstage/demo/blob/master/catalog.yaml',
          presence: 'optional',
        },
      });
    });

    it('output repositories with wildcards default branch option', async () => {
      const location: LocationSpec = {
        type: 'github-discovery',
        target: 'https://github.com/backstage/*/blob/-/catalog.yaml',
      };
      mockGetOrganizationRepositories.mockResolvedValueOnce({
        repositories: [
          {
            name: 'backstage',
            url: 'https://github.com/backstage/tech-docs',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
        ],
      });
      const emitter = jest.fn();

      await processor.readLocation(location, false, emitter);

      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target:
            'https://github.com/backstage/tech-docs/blob/main/catalog.yaml',
          presence: 'optional',
        },
      });
    });

    it("doesn't output repositories as default branch returned is empty", async () => {
      const location: LocationSpec = {
        type: 'github-discovery',
        target: 'https://github.com/backstage/blob/-/catalog.yaml',
      };
      mockGetOrganizationRepositories.mockResolvedValueOnce({
        repositories: [
          {
            name: 'backstage',
            url: 'https://github.com/backstage/tech-docs',
            isArchived: false,
            defaultBranchRef: null,
          },
        ],
      });
      const emitter = jest.fn();

      await processor.readLocation(location, false, emitter);

      expect(emitter).not.toHaveBeenCalled();
    });

    it('output repositories with wildcards default branch option without catalog-info patch or branch match', async () => {
      const location: LocationSpec = {
        type: 'github-discovery',
        target: 'https://github.com/backstage',
      };
      mockGetOrganizationRepositories.mockResolvedValueOnce({
        repositories: [
          {
            name: 'backstage',
            url: 'https://github.com/backstage/backstage',
            isArchived: false,
            defaultBranchRef: {
              name: 'master',
            },
          },
        ],
      });
      const emitter = jest.fn();

      await processor.readLocation(location, false, emitter);

      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target:
            'https://github.com/backstage/backstage/blob/master/catalog-info.yaml',
          presence: 'optional',
        },
      });
    });

    it('output repositories with wildcards', async () => {
      const location: LocationSpec = {
        type: 'github-discovery',
        target:
          'https://github.com/backstage/techdocs-*/blob/master/catalog.yaml',
      };
      mockGetOrganizationRepositories.mockResolvedValueOnce({
        repositories: [
          {
            name: 'backstage',
            url: 'https://github.com/backstage/backstage',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
          {
            name: 'techdocs-cli',
            url: 'https://github.com/backstage/techdocs-cli',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
          {
            name: 'techdocs-container',
            url: 'https://github.com/backstage/techdocs-container',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
          {
            name: 'techdocs-durp',
            url: 'https://github.com/backstage/techdocs-durp',
            isArchived: false,
            defaultBranchRef: null,
          },
        ],
      });
      const emitter = jest.fn();

      await processor.readLocation(location, false, emitter);

      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target:
            'https://github.com/backstage/techdocs-cli/blob/master/catalog.yaml',
          presence: 'optional',
        },
      });
      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target:
            'https://github.com/backstage/techdocs-container/blob/master/catalog.yaml',
          presence: 'optional',
        },
      });
    });

    it('filter unrelated and archived repositories', async () => {
      const location: LocationSpec = {
        type: 'github-discovery',
        target: 'https://github.com/backstage/test/blob/master/catalog.yaml',
      };
      mockGetOrganizationRepositories.mockResolvedValueOnce({
        repositories: [
          {
            name: 'abstest',
            url: 'https://github.com/backstage/abctest',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
          {
            name: 'test',
            url: 'https://github.com/backstage/test',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
          {
            name: 'test-archived',
            url: 'https://github.com/backstage/test',
            isArchived: true,
            defaultBranchRef: {
              name: 'main',
            },
          },
          {
            name: 'testxyz',
            url: 'https://github.com/backstage/testxyz',
            isArchived: false,
            defaultBranchRef: {
              name: 'main',
            },
          },
        ],
      });
      const emitter = jest.fn();

      await processor.readLocation(location, false, emitter);

      expect(emitter).toHaveBeenCalledWith({
        type: 'location',
        location: {
          type: 'url',
          target: 'https://github.com/backstage/test/blob/master/catalog.yaml',
          presence: 'optional',
        },
      });
    });
  });
});
