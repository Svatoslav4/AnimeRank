
import { Module } from '@nestjs/common';
import { AnimeController } from './anime.controller.js';
import { AnimeService } from './anime.service.js';
import { AnilistController } from './animelist.controller.js';
import { AnilistService } from './animelist.service.js';

@Module({
  controllers: [AnimeController, AnilistController],
  providers: [AnimeService, AnilistService],
  exports: [AnimeService, AnilistService],
})
export class AnimeModule {}
