import { IsArray,IsEnum,IsInt,IsOptional,IsString,IsUrl,Max,MaxLength,Min } from "class-validator";
import { AnimeFormat,AnimeStatus } from "@prisma/client";

export class CreateAnimeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  anilistId?: number;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  englishTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  posterUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  bannerUrl?: string;

  @IsOptional()
  @IsEnum(AnimeFormat)
  format?: AnimeFormat;

  @IsOptional()
  @IsEnum(AnimeStatus)
  status?: AnimeStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  episodes?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(3000)
  seasonYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];
}