import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config'; // <-- Import this
import { NvidiaService } from './nvidia.service'; // Adjust path if needed

describe('NvidiaService', () => {
  let service: NvidiaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NvidiaService,
        // Provide a mock version of ConfigService here:
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'), // Mock the .get() method
          },
        },
      ],
    }).compile();

    service = module.get<NvidiaService>(NvidiaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
