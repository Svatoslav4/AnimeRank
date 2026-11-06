import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiChatService } from './ai-chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';


@ApiTags('AnimeAI')
@Controller('ai-chat')
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
  ) {}

  @Post('message')
  @ApiOperation({
    summary: 'Send a message to AnimeAI',
  })
  @ApiResponse({
    status: 201,
    description: 'AI response generated successfully',
  })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.aiChatService.sendMessage(dto.message);
  }

  @Post('stream')
  @ApiOperation({
    summary: 'Send a message to AnimeAI and stream the answer as plain text',
  })
  @ApiResponse({
    status: 201,
    description: 'AI answer streamed in chunks',
  })
  async streamMessage(@Body() dto: SendMessageDto, @Res() res: Response) {
    const stream = this.aiChatService.streamMessage(dto.message);
    res.on('close', () => {
      void stream.return(undefined);
    });

    try {
      // The first chunk is awaited before headers are sent so a failure still returns a proper HTTP error.
      const first = await stream.next();
      res.status(201);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      if (!first.done) res.write(first.value);
      for await (const chunk of stream) {
        res.write(chunk);
      }
      res.end();
    } catch (error) {
      if (!res.headersSent) throw error;
      res.end();
    }
  }
}