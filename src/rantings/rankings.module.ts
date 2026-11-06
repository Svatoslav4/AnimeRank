import { Module } from '@nestjs/common';
import { RankingsController } from './rankings.controller.js';
import { RankingService } from './rantings.service.js';

@Module({
  controllers: [RankingsController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingsModule {}
