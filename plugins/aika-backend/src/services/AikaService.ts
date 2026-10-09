import OpenAI from 'openai';

export class AikaService {
  private readonly client: OpenAI;

  constructor(
    private readonly model: string,
    apiKey: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async ask(question: string): Promise<string> {
    const response = await this.client.responses.create({
      model: this.model,
      instructions:
        'You are AIKA, an engineering platform assistant. ' +
        'Answer clearly and concisely. ' +
        'Do not invent Backstage catalog information.',
      input: question,
    });

    return response.output_text;
  }
}