
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

import { createRouter } from './router';
import { AikaService } from './services/AikaService';
import { todoListServiceRef } from './services/TodoListService';

/**
 * AIKA Backend Plugin
 */
export const aikaPlugin = createBackendPlugin({
  pluginId: 'aika',

  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        todoList: todoListServiceRef,
      },

      async init({
        httpAuth,
        httpRouter,
        config,
        todoList,
      }) {

        // Create the AIKA service
        const aikaService = new AikaService(
          config.getString('aika.model'),
          config.getString('aika.openaiApiKey'),
        );

        // Register the API routes
        httpRouter.use(
          await createRouter({
            httpAuth,
            todoList,
            aikaService,
          }),
        );

        // Allow unauthenticated health checks
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
