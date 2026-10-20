import {ConflictException,Injectable,NotFoundException,} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile-dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            rankings: true,
            animeRatings: true,
            animeLists: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    if (dto.username !== undefined) {
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Username is already taken');
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.username !== undefined && {
            username: dto.username,
          }),
          ...(dto.bio !== undefined && {
            bio: dto.bio,
          }),
          ...(dto.avatarUrl !== undefined && {
            avatarUrl: dto.avatarUrl,
          }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username is already taken');
      }

      throw error;
    }
  }
}
