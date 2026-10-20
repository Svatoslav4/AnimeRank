
import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AnimeFormat, AnimeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const ANILIST_URL = 'https://graphql.anilist.co';

const ANIME_FIELDS = `
  id
  title {
    romaji
    english
  }
  description(asHtml: false)
  coverImage {
    extraLarge
    large
  }
  bannerImage
  format
  status
  episodes
  seasonYear
  genres
`;

const SEARCH_QUERY = `
  query ($search: String!, $page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        lastPage
        hasNextPage
        total
      }
      media(search: $search, type: ANIME, isAdult: false) {
        ${ANIME_FIELDS}
      }
    }
  }
`;

const IMPORT_QUERY = `
  query ($id: Int!) {
    Media(id: $id, type: ANIME) {
      ${ANIME_FIELDS}
    }
  }
`;

interface AniListMedia {
  id: number;
  title?: {
    romaji?: string | null;
    english?: string | null;
  } | null;
  description?: string | null;
  coverImage?: {
    extraLarge?: string | null;
    large?: string | null;
  } | null;
  bannerImage?: string | null;
  format?: string | null;
  status?: string | null;
  episodes?: number | null;
  seasonYear?: number | null;
  genres?: string[] | null;
}

interface AniListResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

@Injectable()
export class AnilistService {
  constructor(private readonly prisma: PrismaService) {}

  async search(search: string, page = 1, perPage = 10) {
    const normalizedSearch = search?.trim();

    if (!normalizedSearch) {
      return {
        items: [],
        pagination: {
          page: 1,
          limit: perPage,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
        },
      };
    }

    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(
      50,
      Math.max(1, Math.floor(perPage) || 10),
    );

    const result = await this.request<{
      Page: {
        pageInfo: {
          currentPage: number;
          lastPage: number;
          hasNextPage: boolean;
          total: number;
        };
        media: AniListMedia[];
      };
    }>(SEARCH_QUERY, {
      search: normalizedSearch,
      page: safePage,
      perPage: safeLimit,
    });

    const pageInfo = result.Page.pageInfo;

    return {
      items: result.Page.media.map((media) =>
        this.toAnimeData(media),
      ),
      pagination: {
        page: pageInfo.currentPage,
        limit: safeLimit,
        total: pageInfo.total,
        totalPages: pageInfo.lastPage,
        hasNextPage: pageInfo.hasNextPage,
      },
    };
  }

  async importAnime(anilistId: number) {
    if (!Number.isInteger(anilistId) || anilistId <= 0) {
      throw new BadGatewayException('Invalid AniList ID');
    }

    const result = await this.request<{
      Media: AniListMedia | null;
    }>(IMPORT_QUERY, { id: anilistId });

    const media = result.Media;

    if (!media) {
      throw new NotFoundException(
        `Anime with AniList ID ${anilistId} was not found on AniList`,
      );
    }

    const data = this.toAnimeData(media);

    try {
      return await this.prisma.anime.upsert({
        where: {
          anilistId: media.id,
        },
        create: data,
        update: data,
      });
    } catch (error) {
      console.error('Prisma anime import error:', error);
      throw error;
    }
  }

  private toAnimeData(media: AniListMedia) {
    return {
      anilistId: media.id,
      title:
        media.title?.romaji?.trim() ||
        media.title?.english?.trim() ||
        `Anime ${media.id}`,
      englishTitle: media.title?.english?.trim() || null,
      description: media.description || null,
      posterUrl:
        media.coverImage?.extraLarge ||
        media.coverImage?.large ||
        null,
      bannerUrl: media.bannerImage || null,
      format: this.mapAnimeFormat(media.format),
      status: this.mapAnimeStatus(media.status),
      episodes: media.episodes ?? null,
      seasonYear: media.seasonYear ?? null,
      genres: media.genres ?? [],
    };
  }

  private mapAnimeStatus(
    status?: string | null,
  ): AnimeStatus | null {
    switch (status) {
      case 'RELEASING':
        return AnimeStatus.AIRING;

      case 'FINISHED':
        return AnimeStatus.FINISHED;

      case 'NOT_YET_RELEASED':
        return AnimeStatus.NOT_YET_RELEASED;

      default:
        return null;
    }
  }

  private mapAnimeFormat(
    format?: string | null,
  ): AnimeFormat | null {
    switch (format) {
      case 'TV':
        return AnimeFormat.TV;

      case 'TV_SHORT':
        return AnimeFormat.TV_SHORT;

      case 'MOVIE':
        return AnimeFormat.MOVIE;

      case 'SPECIAL':
        return AnimeFormat.SPECIAL;

      case 'OVA':
        return AnimeFormat.OVA;

      case 'ONA':
        return AnimeFormat.ONA;

      case 'MUSIC':
        return AnimeFormat.MUSIC;

      default:
        return null;
    }
  }

  private async request<T>(
    query: string,
    variables: Record<string, string | number>,
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Cannot connect to AniList. Please try again later.',
      );
    }

    if (response.status === 429) {
      throw new ServiceUnavailableException(
        'AniList rate limit reached. Please try again later.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `AniList returned HTTP ${response.status}`,
      );
    }

    let body: AniListResponse<T>;

    try {
      body = (await response.json()) as AniListResponse<T>;
    } catch {
      throw new BadGatewayException(
        'Invalid JSON response from AniList',
      );
    }

    if (body.errors?.length) {
      throw new BadGatewayException(
        body.errors.map((error) => error.message).join('; '),
      );
    }

    if (!body.data) {
      throw new BadGatewayException(
        'AniList returned no data',
      );
    }

    return body.data;
  }
}
