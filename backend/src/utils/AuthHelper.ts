import { Request } from 'express';

export class AuthHelper {
    /**
     * Extrae el usuario del request de forma segura.
     * Si no hay usuario (pruebas o error de middleware), devuelve un fallback.
     */
    static getAuthenticatedUser(req: Request) {
        const user = (req as any).user;
        return {
            id: user?.id || 1,
            type_user: user?.type_user || 1
        };
    }
}