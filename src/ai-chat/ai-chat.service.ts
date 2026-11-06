import { Injectable } from "@nestjs/common";
import { AiProviderService } from "./ai-provider.service.js";

@Injectable()
export class AiChatService {
    constructor(private readonly aiProviderService: AiProviderService) {}

    async sendMessage(message: string) {
        const answer = await this.aiProviderService.generateResponse(message)

        return { question: message, answer }
    }

    async *streamMessage(message: string) {
        yield* this.aiProviderService.streamResponse(message)
    }
}