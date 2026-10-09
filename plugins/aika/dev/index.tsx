import { createDevApp } from '@backstage/dev-utils';
import { aikaPlugin, AikaPage } from '../src/plugin';

createDevApp()
  .registerPlugin(aikaPlugin)
  .addPage({
    element: <AikaPage />,
    title: 'Root Page',
    path: '/aika',
  })
  .render();
