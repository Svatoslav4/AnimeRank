
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RankingService } from './rantings.service.js';
import { CreateRankingDto } from './dto/create-ranting-dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';

@Controller('rankings')
export class RankingsController {
  constructor(
    private readonly rankingsService: RankingService,
  ) {}

  @Get()
  findPublished(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.rankingsService.findPublished(page, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateRankingDto,
  ) {
    return this.rankingsService.create(req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.rankingsService.remove(req.user.id, id);
  }
}
