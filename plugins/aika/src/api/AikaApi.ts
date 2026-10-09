
import {
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export class AikaApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  async ask(question: string): Promise<string> {
    const baseUrl = await this.discoveryApi.getBaseUrl('aika');

    const response = await this.fetchApi.fetch(`${baseUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(
        `AIKA request failed with status ${response.status}`,
      );
    }

    const data: { answer: string } = await response.json();
    return data.answer;
  }
}
