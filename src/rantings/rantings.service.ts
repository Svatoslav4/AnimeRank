
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RankingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRankingDto } from './dto/create-ranting-dto.js';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRankingDto) {
    const animeIds = dto.items.map((item) => item.animeId);

    if (new Set(animeIds).size !== animeIds.length) {
      throw new BadRequestException(
        'Не можна додавати одне й те саме аніме двічі.',
      );
    }

    const positions = dto.items.map((item) => item.position);

    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException(
        'Позиції аніме в рейтингу не можуть повторюватися.',
      );
    }

    const animeCount = await this.prisma.anime.count({
      where: { id: { in: animeIds } },
    });

    if (animeCount !== animeIds.length) {
      throw new NotFoundException(
        'Одне або кілька аніме не знайдено в базі даних.',
      );
    }

    const published = dto.status === RankingStatus.PUBLISHED;

    return this.prisma.ranking.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: dto.status,
        publishedAt: published ? new Date() : null,
        user: {
          connect: { id: userId },
        },
        items: {
          create: dto.items.map((item) => ({
            position: item.position,
            score: item.score,
            anime: {
              connect: { id: item.animeId },
            },
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        items: {
          orderBy: { position: 'asc' },
          include: {
            anime: {
              select: {
                id: true,
                title: true,
                englishTitle: true,
                posterUrl: true,
                seasonYear: true,
              },
            },
          },
        },
      },
    });
  }

  async findPublished(page = 1, limit = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));

    const where = {
      status: RankingStatus.PUBLISHED,
    };

    const [items, total] = await Promise.all([
      this.prisma.ranking.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          items: {
            orderBy: { position: 'asc' },
            include: {
              anime: {
                select: {
                  id: true,
                  title: true,
                  englishTitle: true,
                  posterUrl: true,
                  seasonYear: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.ranking.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async remove(userId: string, id: string) {
    const ranking = await this.prisma.ranking.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!ranking) {
      throw new NotFoundException('Рейтинг не знайдено.');
    }

    if (ranking.userId !== userId) {
      throw new ForbiddenException('Можна видаляти лише свої рейтинги.');
    }

    await this.prisma.ranking.delete({ where: { id } });

    return { message: 'Ranking deleted' };
  }
}
