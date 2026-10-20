
import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AnilistService } from './animelist.service.js';

@Controller('anime')
export class AnilistController {
  constructor(private readonly anilistService: AnilistService) {}

  @Get('search')
  search(
    @Query('query') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
  ) {
    if (!query?.trim()) {
      throw new BadRequestException(
        'Query parameter is required. Example: /anime/search?query=Naruto',
      );
    }

    return this.anilistService.search(query, page, 10);
  }

  @Post('import')
  importAnime(
    @Query('anilistId', ParseIntPipe) anilistId: number,
  ) {
    return this.anilistService.importAnime(anilistId);
  }
}
