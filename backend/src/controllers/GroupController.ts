import { Request, Response } from 'express';
import { GroupModel } from '../models/GroupModel';
import { ReleationHomeGroupModel } from '../models/ReleationsHomeGroup';
import { ReleationsGroupsBrottherModel } from '../models/ReleationsGroupsBrottherModel';
import { GroupsImageModel } from '../models/GroupsImageModel';
import { uploadSingle } from '../middleware/uploadMiddleware'; // <-- ASEGÚRATE DE QUE ESTÉ ESTO
import AWSS3Service from '../services/awsS3Service';


export class GroupController {

    private static getUserId(req: Request): number {
        const user = (req as any).user;
        return user?.id || 1; 
    }

    static async create(req: Request, res: Response) {
        try {
            const { id_home} = req.body;
            const created_by = GroupController.getUserId(req);
            const newGroupId = await GroupModel.create(req.body);
            const homeId = Number(id_home);
            if (!isNaN(homeId) && newGroupId) {
                await ReleationHomeGroupModel.create({
                    id_home: homeId,
                    id_group: Number(newGroupId),
                    created_by: created_by 
                });
            } else {
               res.json({ success: false, message: 'Error al crear la relación' });
            }

            res.json({ success: true, data: newGroupId });
        }catch (error) {
            console.error('Error creating group:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id_group = Number(req.params.id);  
            const { id_home } = req.body;            
            const created_by = GroupController.getUserId(req);
            console.log(`Grupo: ${id_group}, Nueva Casa: ${id_home}, Usuario: ${created_by}`);
            await ReleationHomeGroupModel.deteleReleationHomeGroup(id_group, created_by);
            const updatedGroup = await GroupModel.update(id_group.toString(), req.body);
            if (id_home) {
                await ReleationHomeGroupModel.create({
                    id_home: Number(id_home),
                    id_group: id_group,
                    created_by: created_by
                });
            }
            res.json({ success: true, data: updatedGroup });
        } catch (error) {
            console.error('Error updating group:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const created_by = GroupController.getUserId(req);
            const id = Number(req.params.id);
            const listImg = await GroupsImageModel.findByGroupId(id);
            for (const element of listImg) {
                try {
                    if (element.url_img) {
                        await AWSS3Service.deleteImage(element.url_img);
                    }
                    await GroupsImageModel.delete(element.id,created_by);
                } catch (s3Error) {
                    console.error(`No se pudo borrar la imagen ID ${element.id} de S3:`, s3Error);
                }
            }
            await ReleationsGroupsBrottherModel.deleteRelationBrothers(id, created_by);
            const deletedGroup = await GroupModel.delete(id, created_by);
            res.json({ 
                success: true, 
                message: 'Grupo e imágenes eliminados correctamente',
                data: deletedGroup 
            });

        } catch (error: any) {
            console.error('Error deleting group and its images:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al eliminar el grupo' 
            });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const groups = await GroupModel.findAll();
            res.json({ success: true, data: groups });
        } catch (error) {
            console.error('Error getting groups:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const group = await GroupModel.findById(req.params.id);
            res.json({ success: true, data: group });
        } catch (error) {
            console.error('Error getting group:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async getListBrotherAssing(req: Request, res: Response) {
        try {
            const groupId = req.params.id;
            const brothers = await ReleationsGroupsBrottherModel.getListBrotherAssing(groupId);
            const listAssingGroup = await ReleationsGroupsBrottherModel.getListBrotherAssingByGroup(groupId);
            res.json({ success: true, data: brothers, listBrotherAssing : listAssingGroup});
        } catch (error) {
            console.error('Error getting brothers for group:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async assignMembersToGroup(req: Request, res: Response) {
        try {
            const { groupId, members } = req.body;
            const created_by = GroupController.getUserId(req);
            await ReleationsGroupsBrottherModel.deleteRelationBrothers(groupId, created_by);
            if (members && members.length > 0) {
                await ReleationsGroupsBrottherModel.assignMembers(groupId, members, created_by);
            }
            res.status(200).json({ 
                success: true,
            });

        } catch (error) {
            console.error('Error en el controlador assignMembers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error al procesar la asignación de miembros' 
            });
        }
    }

    /**
     * Sube una imagen a la galería del grupo (Usa el mismo estilo que Home)
    */
    static async createImgGroup(req: Request, res: Response) {
        uploadSingle(req, res, async (err: any) => { 
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'No image' });
                }

                const { groupId, orderimg } = req.body;
                const id_brotther = GroupController.getUserId(req);

                if (!groupId) {
                    return res.status(400).json({ success: false, message: 'Falta groupId' });
                }

                const imageUrl = await AWSS3Service.uploadGroupImage(groupId.toString(), req.file);
                console.log(imageUrl);
                const newImage = await GroupsImageModel.create({
                    group_id: parseInt(groupId.toString()),
                    url_img: imageUrl, 
                    orderimg: orderimg ? parseInt(orderimg.toString()) : 1,
                    created_by: id_brotther
                });

                return res.status(201).json({ 
                    success: true, 
                    message: 'Imagen guardada en galería',
                    data: newImage 
                });

            } catch (innerError: any) {
                console.error('Error interno:', innerError);
                return res.status(500).json({ success: false, message: innerError.message });
            }
        });
    }

    /**
     * Obtiene todas las imágenes de la galería de un grupo
     */
    static async getAllImgById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

            const images = await GroupsImageModel.findByGroupId(id);
            
            res.json({
                success: true,
                data: images || []
            });
        } catch (error: any) {
            console.error('❌ Error en getAllImgById:', error.message);
            res.status(500).json({ success: false, message: 'Error al obtener galería' });
        }
    }

    /**
     * Elimina una foto de la galería (S3 + BD)
     */
    static async deleteImgGroup(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const created_by = GroupController.getUserId(req);
            
            const image = await GroupsImageModel.findById(id);
            if (!image) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });

            if (image.url_img) {
                await AWSS3Service.deleteImage(image.url_img);
            }

            const deleted = await GroupsImageModel.delete(id, created_by);

            res.json({
                success: true,
                message: 'Imagen eliminada correctamente'
            });
        } catch (error: any) {
            console.error('❌ Error en deleteImgGroup:', error);
            res.status(500).json({ success: false, message: 'Error interno al eliminar' });
        }
    }
}
