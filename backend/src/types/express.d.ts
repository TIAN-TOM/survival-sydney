// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// type-level augmentation of Express so authenticated handlers see `req.user`.

/** Public, password-free user shape produced by User#toSafeObject(). */
export interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated by auth.middleware from a verified session JWT. Declared
       * non-optional because every route that reads it mounts the auth
       * middleware first, so handlers never observe it missing.
       */
      user: SafeUser;
    }
  }
}
