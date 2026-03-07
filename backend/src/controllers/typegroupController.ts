import { Request, Response } from 'express';
import { TypeGroupModel } from '../models/TypeGroupModel';
import { GroupModel } from '../models/GroupModel';
import { uploadSingle } from '../middleware/uploadMiddleware';
import AWSS3Service from '../services/awsS3Service';
import { GroupsImageModel } from '../models/GroupsImageModel';
import { ReleationsGroupsBrottherModel } from '../models/ReleationsGroupsBrottherModel';

export class TypeGroupController {

    /**
     * Crea un nuevo tipo de grupo
     */
    static async create(req: Request, res: Response) {
        try {
            // Importante: Multer debe procesar el req primero
            uploadSingle(req, res, async (err) => {
                if (err) {
                    console.error('❌ Error de Multer:', err.message);
                    return res.status(400).json({ success: false, message: err.message });
                }

                const { name, activity } = req.body;
                
                // Obtenemos el ID del usuario desde el token (inyectado por el middleware de auth)
                const created_by = (req as any).user?.id || 1;

                // Validación: Ahora req.body ya contiene los datos procesados por Multer
                if (!name || !activity) {
                    return res.status(400).json({
                        success: false,
                        message: 'El nombre y la actividad son requeridos'
                    });
                }

                let finalImageUrl = '';

                // Si hay un archivo, lo subimos a S3
                if (req.file) {
                    try {
                        finalImageUrl = await AWSS3Service.uploadIconGroupImage(req.file);
                    } catch (s3Error: any) {
                        console.error('❌ Error S3:', s3Error.message);
                        return res.status(500).json({ success: false, message: 'Error al subir imagen a S3' });
                    }
                }

                const groupData = {
                    name,
                    activity,
                    img: finalImageUrl,
                    created_by: parseInt(created_by.toString())
                };

                const newGroup = await TypeGroupModel.create(groupData);
                
                return res.status(201).json({
                    success: true,
                    message: 'Tipo de grupo creado exitosamente',
                    data: newGroup
                });
            });
        } catch (error: any) {
            console.error('❌ Error general en create:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Actualiza un tipo de grupo existente
     */
    static async update(req: Request, res: Response) {
        try {
            uploadSingle(req, res, async (err) => {
                if (err) return res.status(400).json({ success: false, message: err.message });

                const id = parseInt(req.params.id);
                const { name, activity } = req.body;
                const created_by = (req as any).user?.id || 1;

                if (isNaN(id)) {
                    return res.status(400).json({ success: false, message: 'ID de grupo inválido' });
                }

                let updateData: any = { 
                    name, 
                    activity, 
                    created_by: parseInt(created_by.toString()) 
                };

                // Si el usuario sube una nueva imagen
                if (req.file) { 
                    const searchGroup = await TypeGroupModel.findById(id);
                    
                    // Borramos la imagen anterior de S3 si existe
                    if (searchGroup?.img) {
                        await AWSS3Service.deleteImage(searchGroup.img);
                    }
                    
                    // Subimos la nueva
                    updateData.img = await AWSS3Service.uploadIconGroupImage(req.file);
                }
                
                const updatedGroup = await TypeGroupModel.update(id, updateData);
                
                if (!updatedGroup) {
                    return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
                }

                return res.json({
                    success: true,
                    message: 'Tipo de grupo actualizado exitosamente',
                    data: updatedGroup
                });
            });
        } catch (error: any) {
            console.error('❌ Error en update:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Elimina un tipo de grupo (S3 + DB)
     */
    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
            const created_by = (req as any).user?.id || 1;
            const searchGroupImg = await GroupsImageModel.searchByTypeGroup(id);
            for (const element of searchGroupImg) {
                try {
                    console.log(element);
                    if (element.url_img) {
                        await AWSS3Service.deleteImage(element.url_img);
                    }
                    await GroupsImageModel.delete(element.id,created_by);
                    await ReleationsGroupsBrottherModel.deleteRelationBrothers(element.group_id, created_by);
                    await GroupModel.delete(element.group_id, created_by);
                } catch (s3Error) {
                    console.error(`No se pudo borrar la imagen ID de S3:`, s3Error);
                }
            }
            await TypeGroupModel.delete(id);

            return res.json({
                success: true,
                message: 'Tipo de grupo e imagen eliminados exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error en delete:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Obtiene todos los tipos de grupo
     */
    static async getAll(req: Request, res: Response) {
        try {
            const groups = await TypeGroupModel.findAll();
            return res.json({
                success: true,
                data: groups,
                count: groups.length
            });
        } catch (error: any) {
            console.error('❌ Error en getAll:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    /**
     * Obtiene un tipo de grupo por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const group = await TypeGroupModel.findById(id);
            
            if (!group) {
                return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
            }
            
            return res.json({ success: true, data: group });
        } catch (error: any) {
            console.error('❌ Error en getById:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}