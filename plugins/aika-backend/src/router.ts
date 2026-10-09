import { AikaService } from './services/AikaService';
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { todoListServiceRef } from './services/TodoListService';

export async function createRouter({
  httpAuth,
  todoList,
  aikaService,
}: {
  httpAuth: HttpAuthService;
  todoList: typeof todoListServiceRef.T;
  aikaService: AikaService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // AIKA Health Check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AIKA Backend',
  });
});

const askSchema = z.object({
  question: z.string().trim().min(1).max(4000),
});

router.post('/ask', async (req, res) => {
  await httpAuth.credentials(req, {
    allow: ['user'],
  });

  const parsed = askSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new InputError(parsed.error.toString());
  }

  const answer = await aikaService.ask(
    parsed.data.question,
  );

  res.json({
    question: parsed.data.question,
    answer,
  });
});

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoList.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await todoList.listTodos());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoList.getTodo({ id: req.params.id }));
  });

  return router;
}
