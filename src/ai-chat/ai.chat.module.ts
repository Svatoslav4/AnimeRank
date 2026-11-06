import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiChatController } from './ai-chat.controller.js';
import { AiChatService } from './ai-chat.service.js';
import { AiProviderService } from './ai-provider.service.js';


@Module({
  imports: [ConfigModule],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    AiProviderService,
  ],
  exports: [AiChatService],
})
export class AiChatModule {}