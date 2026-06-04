import { Request } from 'express';

export class AuthHelper {
    /**
     * Extrae el usuario del request de forma segura.
     * Si no hay usuario (pruebas o error de middleware), devuelve un fallback.
     */
    static getAuthenticatedUser(req: Request) {
        const user = (req as any).user;
        if (!user?.id) {
            throw new Error('Usuario no autenticado');
        }
        const typeUser = Number(user.type_user);
        if (!Number.isFinite(typeUser)) {
            throw new Error('Sesión inválida: vuelve a iniciar sesión');
        }
        return {
            id: Number(user.id),
            id_brother: user.id_brother != null ? Number(user.id_brother) : null,
            type_user: typeUser,
            name_brother: user.name_brother,
        };
    }
}