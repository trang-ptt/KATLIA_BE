import { UploadedFileMetadata } from '@nestjs/azure-storage/dist/azure-storage.service';
import { Controller, Body, Put, Param, UseGuards, Get, UploadedFile } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { GetUser } from 'src/auth/decorator';
import { user } from '@prisma/client';
import { ProfileDto } from './dto';
import { get } from 'http';
import { Patch, UseInterceptors } from '@nestjs/common/decorators';
import { AzureStorageFileInterceptor } from '@nestjs/azure-storage';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Put('updateProfile')
  updateAddress(@GetUser() user: user, @Body() dto: ProfileDto) {
    return this.profileService.updateProfile(user, dto);
  }

  @Get('getProfile')
  getProfile(@GetUser() user: user) {
    return this.profileService.getProfile(user);
  }

  @Patch('updateAva')
  @UseInterceptors(
    AzureStorageFileInterceptor('file', null, {
      containerName: 'img',
    }),
  )
  async updateAva(
    @GetUser() user: user,
    @UploadedFile() file: UploadedFileMetadata,
  ) {
    return this.profileService.updateAva(user, file.storageUrl)
  }
}
