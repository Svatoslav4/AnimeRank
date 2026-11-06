
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import { AnimeService } from './anime.service.js';
import { AnilistService } from './animelist.service.js';
import { CreateAnimeDto } from './dto/create-anime.dto.js';
import { QueryAnimeDto } from './dto/query-anime-dto.js';

@Controller('anime')
export class AnimeController {
  constructor(
    private readonly animeService: AnimeService,
    private readonly anilistService: AnilistService,
  ) {}

  // GET /anime/search?query=Naruto&page=1
  @Get('search')
  search(
    @Query('query') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
  ) {
    if (!query?.trim()) {
      throw new BadRequestException(
        'Query is required. Example: /anime/search?query=Naruto',
      );
    }

    return this.anilistService.search(query.trim(), page, 10);
  }

  // POST /anime/import?anilistId=20
  @Post('import')
  importAnime(
    @Query('anilistId', ParseIntPipe) anilistId: number,
  ) {
    return this.anilistService.importAnime(anilistId);
  }

  // GET /anime?search=Naruto&page=1&limit=20
  @Get()
  findAll(@Query() query: QueryAnimeDto) {
    return this.animeService.findAll(query);
  }

  // GET /anime/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.animeService.findOne(id);
  }

  // POST /anime
  @Post()
  create(@Body() dto: CreateAnimeDto) {
    return this.animeService.create(dto);
  }
}
