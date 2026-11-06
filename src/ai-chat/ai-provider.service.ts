import {Injectable,InternalServerErrorException,Logger,ServiceUnavailableException,} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';


@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly fallbackModel?: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.model =
      this.configService.get<string>('GEMINI_MODEL') ??
      'gemini-3.8-flash';

    this.fallbackModel = this.configService.get<string>(
      'GEMINI_FALLBACK_MODEL',
    );

    this.ai = new GoogleGenAI({
      apiKey,
    });
  }

  async generateResponse(message: string): Promise<string> {
    const models = [this.model, this.fallbackModel].filter(
      (m, i, arr): m is string => !!m && arr.indexOf(m) === i,
    );

    try {
      let lastError: unknown;

      for (const model of models) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            return await this.generate(model, message);
          } catch (error) {
            lastError = error;
            if (!this.isRetryable(error)) throw error;
            this.logger.warn(
              `Gemini ${model} unavailable (attempt ${attempt + 1}/3)`,
            );
            if (attempt < 2) await this.sleep(1000 * 2 ** attempt);
          }
        }
      }

      throw lastError;
    } catch (error) {
      this.logger.error('Gemini API request failed', error);

      if (this.isRetryable(error)) {
        throw new ServiceUnavailableException(
          'AnimeAI is temporarily unavailable. Please try again later.',
        );
      }

      throw new InternalServerErrorException(
        'Failed to generate AI response',
      );
    }
  }

  private isRetryable(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    return status === 503 || status === 429;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async *streamResponse(message: string): AsyncGenerator<string> {
    const models = [this.model, this.fallbackModel].filter(
      (m, i, arr): m is string => !!m && arr.indexOf(m) === i,
    );
    let lastError: unknown;

    for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        let started = false;
        try {
          const stream = await this.ai.models.generateContentStream({
            model,
            contents: message,
            config: this.generationConfig(),
          });

          for await (const chunk of stream) {
            if (chunk.text) {
              started = true;
              yield chunk.text;
            }
          }

          if (!started) throw new Error('Gemini returned an empty response');
          return;
        } catch (error) {
          lastError = error;
          // Once text was sent to the client it cannot be retried transparently.
          if (started || !this.isRetryable(error)) {
            this.logger.error('Gemini API stream failed', error);
            throw new InternalServerErrorException('Failed to generate AI response');
          }
          this.logger.warn(`Gemini ${model} unavailable (attempt ${attempt + 1}/3)`);
          if (attempt < 2) await this.sleep(1000 * 2 ** attempt);
        }
      }
    }

    this.logger.error('Gemini API stream failed', lastError);
    throw new ServiceUnavailableException(
      'AnimeAI is temporarily unavailable. Please try again later.',
    );
  }

  private generationConfig() {
    return {
          systemInstruction: `
            You are AnimeAI, the official AI assistant of AnimeRank.

            Your specialization is exclusively anime and manga.

            You can:
            - Recommend anime based on user preferences.
            - Explain anime plots, characters and story arcs.
            - Discuss genres, studios and animation.
            - Compare anime.
            - Help users discover new anime.

            Rules:
            - Respond in the same language as the user.
            - Be friendly, helpful and conversational.
            - Stay focused on anime and manga topics.
            - If a question is unrelated to anime or manga,
              politely explain that you only answer anime-related questions.
            - Never invent release dates, episode counts or ratings.
            - If you are unsure about something, say so.
          `,
          temperature: 0.7,
          maxOutputTokens: 2048,
    };
  }

  private async generate(model: string, message: string): Promise<string> {
    {
      const response = await this.ai.models.generateContent({
        model,
        contents: message,
        config: this.generationConfig(),
      });

      const answer = response.text;

      if (!answer) {
        throw new Error('Gemini returned an empty response');
      }

      return answer;
    }
  }
}