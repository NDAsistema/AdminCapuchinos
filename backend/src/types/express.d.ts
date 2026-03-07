// src/types/express.d.ts
declare namespace Express {
  export interface Request {
    user?: {
      id: number;
      id_brother: number;
      email: string;
      type_user: number;
    };
  }
}