
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RankingStatus } from '@prisma/client';

class CreateRankingItemDto {
  @IsString()
  animeId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  position!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  score!: number;
}

export class CreateRankingDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(RankingStatus)
  status!: RankingStatus;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRankingItemDto)
  items!: CreateRankingItemDto[];
}
