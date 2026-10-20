import {Body,Controller,Get,Param,Patch,Req,UseGuards,} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile-dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guards.js';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getPublicProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Req() req: AuthenticatedRequest,@Body() dto: UpdateProfileDto,) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
