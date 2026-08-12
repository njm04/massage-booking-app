export interface AuthenticatedUser {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?:
    | {
        _id: string;
        name: string;
      }
    | string
    | null;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
