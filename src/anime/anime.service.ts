import {Injectable,NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAnimeDto } from './dto/create-anime.dto.js';
import { QueryAnimeDto } from './dto/query-anime-dto.js';

@Injectable()
export class AnimeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnimeDto) {
    return this.prisma.anime.create({
      data: {
        anilistId: dto.anilistId,
        title: dto.title,
        englishTitle: dto.englishTitle,
        description: dto.description,
        posterUrl: dto.posterUrl,
        bannerUrl: dto.bannerUrl,
        format: dto.format,
        status: dto.status,
        episodes: dto.episodes,
        seasonYear: dto.seasonYear,
        genres: dto.genres,
      },
    });
  }

  async findAll(query: QueryAnimeDto) {
    const { search,format,status,genre,year,page = 1,limit = 20, } = query;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          {
            englishTitle: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      ...(format && { format }),
      ...(status && { status }),
      ...(genre && { genres: { has: genre } }),
      ...(year && { seasonYear: year }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.anime.findMany({
        where,
        orderBy: { title: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.anime.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const anime = await this.prisma.anime.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            ratings: true,
            rankingItems: true,
            userLists: true,
          },
        },
      },
    });

    if (!anime) {
      throw new NotFoundException('Anime not found');
    }

    return anime;
  }
}
