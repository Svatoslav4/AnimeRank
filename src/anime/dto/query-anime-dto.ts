import { Type } from 'class-transformer';
import {IsEnum,IsInt,IsOptional,IsString,Max,Min,} from 'class-validator';
import { AnimeFormat, AnimeStatus } from '@prisma/client';

export class QueryAnimeDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AnimeFormat)
  format?: AnimeFormat;

  @IsOptional()
  @IsEnum(AnimeStatus)
  status?: AnimeStatus;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(3000)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
