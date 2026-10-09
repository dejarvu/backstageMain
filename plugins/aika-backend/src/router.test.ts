
import { AikaService } from './services/AikaService';
import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { todoListServiceRef } from './services/TodoListService';

const mockTodoItem = {
  title: 'Do the thing',
  id: '123',
  createdBy: mockCredentials.user().principal.userEntityRef,
  createdAt: new Date().toISOString(),
};

describe('createRouter', () => {
  let app: express.Express;
  let todoList: jest.Mocked<typeof todoListServiceRef.T>;
  let aikaService: jest.Mocked<Pick<AikaService, 'ask'>>;

  beforeEach(async () => {
    todoList = {
      createTodo: jest.fn(),
      listTodos: jest.fn(),
      getTodo: jest.fn(),
    };

    // Mock OpenAI calls so tests do not use the real API.
    aikaService = {
      ask: jest.fn(),
    };

    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      todoList,
      aikaService: aikaService as unknown as AikaService,
    });

    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a TODO', async () => {
    todoList.createTodo.mockResolvedValue(mockTodoItem);

    const response = await request(app)
      .post('/todos')
      .send({
        title: 'Do the thing',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockTodoItem);
  });

  it('should not allow unauthenticated requests to create a TODO', async () => {
    todoList.createTodo.mockResolvedValue(mockTodoItem);

    const response = await request(app)
      .post('/todos')
      .set('Authorization', mockCredentials.none.header())
      .send({
        title: 'Do the thing',
      });

    expect(response.status).toBe(401);
  });

  it('should answer a valid AIKA question', async () => {
    aikaService.ask.mockResolvedValue(
      'Backstage is a developer portal.',
    );

    const response = await request(app)
      .post('/ask')
      .send({
        question: 'What is Backstage?',
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      question: 'What is Backstage?',
      answer: 'Backstage is a developer portal.',
    });

    expect(aikaService.ask).toHaveBeenCalledWith(
      'What is Backstage?',
    );
  });

  it('should reject an empty AIKA question', async () => {
    const response = await request(app)
      .post('/ask')
      .send({
        question: '',
      });

    expect(response.status).toBe(400);
    expect(aikaService.ask).not.toHaveBeenCalled();
  });

  it('should reject unauthenticated AIKA requests', async () => {
    const response = await request(app)
      .post('/ask')
      .set('Authorization', mockCredentials.none.header())
      .send({
        question: 'What is Backstage?',
      });

    expect(response.status).toBe(401);
    expect(aikaService.ask).not.toHaveBeenCalled();
  });
});
