import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        // Remove the real AuthService and replace it with this Mock:
        {
          provide: AuthService,
          useValue: {
            // Mock whatever methods your controller actually calls
            // Based on your earlier logs, it looks like you have these:
            signup: jest.fn(),
            login: jest.fn(),
            getProfile: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Inside describe('AuthController', () => { ... })

  it('should successfully sign up a user', async () => {
    // 1. Arrange: Create fake data for the test
    const fakeDto = { email: 'test@test.com', password: 'password123' };
    const expectedResult = {
      id: 1,
      email: 'test@test.com',
      token: 'fake-jwt-token',
    };

    // Tell our Mock AuthService what to return when signup is called
    const authService = module.get<AuthService>(AuthService);
    authService.signup = jest.fn().mockResolvedValue(expectedResult);

    // 2. Act: Call the controller method
    const result = await controller.signup(fakeDto);

    // 3. Assert: Check if the result matches what we expect
    expect(authService.signup).toHaveBeenCalledWith(fakeDto); // Did it pass the right data to the service?
    expect(result).toEqual(expectedResult); // Did the controller return the exact data?
  });
});
