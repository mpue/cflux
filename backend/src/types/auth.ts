import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  /**
   * Nur gesetzt, wenn die Authentifizierung ueber einen API-Schluessel lief.
   * Vorhandensein bedeutet: zusaetzlich zu Rolle und Modulrechten des Users
   * greifen die Scopes des Schluessels.
   */
  apiKey?: {
    id: string;
    name: string;
    scopes: string[];
    readOnly: boolean;
  };
}
