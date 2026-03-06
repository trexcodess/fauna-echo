import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginUserDTO {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  id: string;
}
