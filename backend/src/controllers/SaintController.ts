import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AuthController } from './authController';
import { SaintModel } from '../models/SaintModel';
import AWSS3Service from '../services/awsS3Service';

function canManageSaints(typeUser: number): boolean {
    return typeUser === 1 || typeUser === 3;
}

export class SaintController {
    static async findAll(req: AuthRequest, res: Response) {
        try {
            const typeUser = Number(req.user?.type_user);
            if (!canManageSaints(typeUser)) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
            const saints = await SaintModel.findAll();
            return res.json({ success: true, data: saints });
        } catch (error: any) {
            console.error('Error en findAll saints:', error.message);
            return res.status(500).json({ success: false, message: 'Error al obtener santos' });
        }
    }

    static async findById(req: AuthRequest, res: Response) {
        try {
            const typeUser = Number(req.user?.type_user);
            if (!canManageSaints(typeUser)) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }
            const saint = await SaintModel.findById(Number(req.params.id));
            if (!saint) {
                return res.status(404).json({ success: false, message: 'Santo no encontrado' });
            }
            return res.json({ success: true, data: saint });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Error al obtener santo' });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const typeUser = Number(req.user?.type_user);
            if (!canManageSaints(typeUser)) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const { title, content, date_birth, date_death, type } = req.body;
            const file = req.file;
            const created_by = AuthController.getUserId(req);

            if (!title?.trim()) {
                return res.status(400).json({ success: false, message: 'El nombre es requerido' });
            }

            let imageUrl: string | null = null;
            if (file) {
                imageUrl = await AWSS3Service.uploadSaintImage(file);
            }

            const saintType = Number(type);
            if (saintType !== 1 && saintType !== 2) {
                return res.status(400).json({ success: false, message: 'Tipo de santo inválido' });
            }

            const newSaint = await SaintModel.create({
                title: title.trim(),
                content: content || '',
                date_birth: date_birth || null,
                date_death: date_death || null,
                type: saintType,
                img: imageUrl,
                status: 1,
                created_by: Number(created_by),
            });

            if (newSaint.id && content) {
                await SaintController.bindContentImages(newSaint.id, content);
            }

            return res.status(201).json({ success: true, data: newSaint });
        } catch (error: any) {
            console.error('Error en create saint:', error.message);
            return res.status(500).json({ success: false, message: 'Error al crear santo' });
        }
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const typeUser = Number(req.user?.type_user);
            if (!canManageSaints(typeUser)) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const id = Number(req.params.id);
            const { title, content, date_birth, date_death, type } = req.body;
            const file = req.file;
            const created_by = AuthController.getUserId(req);

            const existing = await SaintModel.findById(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Santo no encontrado' });
            }

            let imageUrl = existing.img;
            if (file) {
                imageUrl = await AWSS3Service.uploadSaintImage(file);
                if (existing.img) {
                    try {
                        await AWSS3Service.deleteImage(existing.img);
                    } catch {
                        /* ignore S3 delete errors */
                    }
                }
            }

            const saintType = type !== undefined ? Number(type) : existing.type;
            if (saintType !== 1 && saintType !== 2) {
                return res.status(400).json({ success: false, message: 'Tipo de santo inválido' });
            }

            await SaintModel.update(id, {
                title: title?.trim() || existing.title,
                content: content ?? existing.content,
                date_birth: date_birth !== undefined ? date_birth || null : existing.date_birth,
                date_death: date_death !== undefined ? date_death || null : existing.date_death,
                type: saintType,
                img: imageUrl,
                created_by: Number(created_by),
            });

            if (content) {
                await SaintController.bindContentImages(id, content);
            }

            return res.json({ success: true, message: 'Santo actualizado correctamente' });
        } catch (error: any) {
            console.error('Error en update saint:', error.message);
            return res.status(500).json({ success: false, message: 'Error al actualizar santo' });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const typeUser = Number(req.user?.type_user);
            if (!canManageSaints(typeUser)) {
                return res.status(403).json({ success: false, message: 'No autorizado' });
            }

            const id = Number(req.params.id);
            const created_by = AuthController.getUserId(req);
            const deleted = await SaintModel.softDelete(id, Number(created_by));

            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Santo no encontrado' });
            }

            return res.json({ success: true, message: 'Santo eliminado correctamente' });
        } catch (error: any) {
            console.error('Error en delete saint:', error.message);
            return res.status(500).json({ success: false, message: 'Error al eliminar santo' });
        }
    }

    static bindContentImages = async (saintId: number, htmlContent: string) => {
        const { SaintAttachmentModel } = await import('../models/SaintAttachmentModel');
        const imageRegex = /https:\/\/[^"\s]+\.(?:jpg|jpeg|png|gif|webp)/gi;
        const urlsFound = htmlContent.match(imageRegex) || [];
        if (urlsFound.length > 0) {
            await SaintAttachmentModel.bindToSaint(saintId, urlsFound);
        }
    };
}
