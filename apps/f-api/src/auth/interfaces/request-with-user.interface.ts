import { Request } from '@nestjs/common';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null; // <--- ADD THIS LINE!
  };
}