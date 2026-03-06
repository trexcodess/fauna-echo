import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetsService } from './pet.service';
import 'multer';

interface PetDataPayload {
  id?: string;
  name?: string;
  microchip?: string;
  geometry?: string;
}

interface AnalyzeBody {
  prompt: string;
  imageData?: string;
  petData: PetDataPayload;
}

@Controller('pets')
export class PetsController {
  // Add a NestJS logger for clean terminal output
  private readonly logger = new Logger(PetsController.name);

  constructor(private readonly petsService: PetsService) {}

  // --------------------------------------------------------
  // 🛰️ MISSION CONTROL: Generate Sighting Bounties
  // --------------------------------------------------------
  @Post('bounties')
  async getBounties(@Body('prompt') prompt: string) {
    this.logger.log('Generating new pet bounties...');
    return this.petsService.generateBounties(prompt);
  }

  // --------------------------------------------------------
  // 📸 TACTICAL HUD: Analyze Captured Image & Data
  // --------------------------------------------------------
  @Post('analyze')
  async analyzePet(@Body() body: AnalyzeBody) {
    this.logger.log(
      `Analyzing forensic data for subject: ${body.petData?.name || 'UNKNOWN'}`,
    );

    // Pass the typed data cleanly to the service
    return this.petsService.analyzePet(
      body.prompt,
      body.imageData,
      body.petData,
    );
  }

  // --------------------------------------------------------
  // 📂 BIOMETRIC ARCHIVE: Fetch all saved subjects
  // --------------------------------------------------------
  @Get('archive')
  async getArchive() {
    this.logger.log('Fetching secure biometric archive...');
    // Calls findAll() from your service, which should return the DB records!
    return this.petsService.findAll();
  }

  // Fallback GET route just in case
  @Get()
  async findAll() {
    return this.petsService.findAll();
  }

  // --------------------------------------------------------
  // 🎥 VIDEO FORENSICS: Upload & Analyze Video
  // --------------------------------------------------------
  @Post('analyze-video')
  @UseInterceptors(FileInterceptor('video')) // 'video' matches formData.append('video', ...)
  async analyzeVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body('prompt') prompt: string,
  ) {
    if (!file) {
      this.logger.error('Video upload failed: No file received.');
      throw new BadRequestException('No video file uploaded by the Agent.');
    }

    this.logger.log(`Received video: ${file.originalname}`);
    this.logger.log(
      `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB | Type: ${file.mimetype}`,
    );

    // TODO: Pass this to your NVIDIA Service or Video processing logic
    // Example: const report = await this.nvidiaService.analyzeVideo(file, prompt);

    return {
      status: 'SUCCESS',
      message: 'Video received by Agency mainframe.',
      report:
        'GAIT ANALYSIS COMPLETE: Subject exhibits an asymmetric trot matching the target profile. Recommend field verification.',
    };
  }
}
