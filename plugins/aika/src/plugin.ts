
import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const aikaPlugin = createPlugin({
  id: 'aika',
  routes: {
    root: rootRouteRef,
  },
});

export const AikaPage = aikaPlugin.provide(
  createRoutableExtension({
    name: 'AikaPage',
    component: () =>
      import('./components/AikaPage/AikaPage').then(
        module => module.AikaPage,
      ),
    mountPoint: rootRouteRef,
  }),
);
