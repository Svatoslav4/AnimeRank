import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module.js';
import { AnimeModule } from './anime/anime.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RankingsModule } from './rantings/rankings.module.js';
import { AiChatModule } from './ai-chat/ai.chat.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AnimeModule,
    AuthModule,
    RankingsModule,
    AiChatModule
  ],
})
export class AppModule {}
