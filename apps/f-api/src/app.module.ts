// apps/f-api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NvidiaService } from './nvidia/nvidia.service';
import { PetsService } from './pet/pet.service';
import { PetsController } from './pet/pet.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This is essential
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  providers: [NvidiaService, PetsService],
  controllers: [PetsController],
})
export class AppModule {}
