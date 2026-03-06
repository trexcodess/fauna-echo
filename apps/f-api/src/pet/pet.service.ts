import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NvidiaService } from '../nvidia/nvidia.service';

export interface PetUpdateData {
  id?: string;
  name?: string;
  microchip?: string;
  geometry?: string;
}

@Injectable()
export class PetsService {
  constructor(
    private prisma: PrismaService,
    private nvidiaService: NvidiaService,
  ) {}

  async generateBounties(prompt: string) {
    const responseText: string = String(
      await this.nvidiaService.generateResponse(prompt),
    );

    return { result: responseText };
  }

  async analyzePet(
    prompt: string,
    imageData: string | undefined,
    petData: PetUpdateData,
  ) {
    // 4. Wrap in String() to guarantee the type
    const reportText: string = String(
      await this.nvidiaService.generateResponse(prompt, imageData),
    );

    if (petData?.id) {
      try {
        await this.prisma.pet.update({
          where: { id: petData.id },
          data: {
            microchipId: petData.microchip,
            geometry: petData.geometry,
            ...(imageData && { nosePrint: imageData }),
          },
        });
      } catch (error: unknown) {
        console.log(
          'Note: Pet ID not found in database, skipping Prisma update.',
        );
      }
    }

    return { report: reportText };
  }

  async findAll() {
    return this.prisma.pet.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
