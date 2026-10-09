
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';

import { createServiceFactory } from '@backstage/backend-plugin-api';
import { todoListServiceRef } from './services/TodoListService';
import { aikaPlugin } from './plugin';
import request from 'supertest';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

import {
  ConflictError,
  AuthenticationError,
  NotAllowedError,
} from '@backstage/errors';

// Mock AIKA configuration for integration tests.
// No real OpenAI API key is required.
const mockAikaConfig = () =>
  mockServices.rootConfig.factory({
    data: {
      aika: {
        model: 'gpt-5',
        openaiApiKey: 'test-placeholder-key',
      },
    },
  });

describe('plugin', () => {
  it('should create and read TODO items', async () => {
    const { server } = await startTestBackend({
      features: [
        aikaPlugin,
        mockAikaConfig(),
      ],
    });

    await request(server)
      .get('/api/aika/todos')
      .expect(200, {
        items: [],
      });

    const createRes = await request(server)
      .post('/api/aika/todos')
      .send({
        title: 'My Todo',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual({
      id: expect.any(String),
      title: 'My Todo',
      createdBy: mockCredentials.user().principal.userEntityRef,
      createdAt: expect.any(String),
    });

    const createdTodoItem = createRes.body;

    await request(server)
      .get('/api/aika/todos')
      .expect(200, {
        items: [createdTodoItem],
      });

    await request(server)
      .get(`/api/aika/todos/${createdTodoItem.id}`)
      .expect(200, createdTodoItem);
  });

  it('should create TODO item with catalog information', async () => {
    const { server } = await startTestBackend({
      features: [
        aikaPlugin,
        mockAikaConfig(),

        catalogServiceMock.factory({
          entities: [
            {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'Component',
              metadata: {
                name: 'my-component',
                namespace: 'default',
                title: 'My Component',
              },
              spec: {
                type: 'service',
                owner: 'me',
              },
            },
          ],
        }),
      ],
    });

    const createRes = await request(server)
      .post('/api/aika/todos')
      .send({
        title: 'My Todo',
        entityRef: 'component:default/my-component',
      });

    expect(createRes.status).toBe(201);

    expect(createRes.body).toEqual({
      id: expect.any(String),
      title: '[My Component] My Todo',
      createdBy: mockCredentials.user().principal.userEntityRef,
      createdAt: expect.any(String),
    });
  });

  it('should forward errors from the TodoListService', async () => {
    const { server } = await startTestBackend({
      features: [
        aikaPlugin,
        mockAikaConfig(),

        createServiceFactory({
          service: todoListServiceRef,
          deps: {},

          factory: () => ({
            createTodo: jest.fn().mockRejectedValue(
              new ConflictError(),
            ),

            listTodos: jest.fn().mockRejectedValue(
              new AuthenticationError(),
            ),

            getTodo: jest.fn().mockRejectedValue(
              new NotAllowedError(),
            ),
          }),
        }),
      ],
    });

    const createRes = await request(server)
      .post('/api/aika/todos')
      .send({
        title: 'My Todo',
        entityRef: 'component:default/my-component',
      });

    expect(createRes.status).toBe(409);

    expect(createRes.body).toMatchObject({
      error: {
        name: 'ConflictError',
      },
    });

    const listRes = await request(server)
      .get('/api/aika/todos');

    expect(listRes.status).toBe(401);

    expect(listRes.body).toMatchObject({
      error: {
        name: 'AuthenticationError',
      },
    });

    const getRes = await request(server)
      .get('/api/aika/todos/123');

    expect(getRes.status).toBe(403);

    expect(getRes.body).toMatchObject({
      error: {
        name: 'NotAllowedError',
      },
    });
  });
});
