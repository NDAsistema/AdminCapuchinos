import { Request, Response } from 'express';
import { HomeModel, Home } from '../models/HomeModel';
import { HomeImageModel, HomeImage } from '../models/HomeImageModel';
import { uploadSingle } from '../middleware/uploadMiddleware';
import AWSS3Service from '../services/awsS3Service';
import { AuthRequest } from '../middleware/authMiddleware'; 
import { GroupsImageModel } from '../models/GroupsImageModel';  

export class HomeController {
    
    // Cambiado a AuthRequest para usar req.user.id
    static async create(req: AuthRequest, res: Response) {
        try {
            const createBy = req.user?.id || 0;
            const homeData = {
                name: req.body.name,
                guardian: req.body.guardian,
                parish_priest: req.body.parish_priest,
                founder: req.body.founder,
                communication_user: req.body.communication_user,
                history: req.body.history,
                state: req.body.state,
                city: req.body.city,
                location: req.body.location,
                contacts: req.body.contacts,
                create_by: createBy
            };
            
            const newHome = await HomeModel.create(homeData);
            
            res.status(201).json({
                success: true,
                message: 'Fraternidad creada exitosamente',
                data: newHome
            });
            
        } catch (error: any) {
            console.error('❌ Error en HomeController.create:', error.message);
            
            if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos en la base de datos',
                    field: error.sqlMessage?.match(/Field '(.+)'/)?.[1]
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al crear la fraternidad',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Aunque no use user, es mejor mantener AuthRequest por consistencia si la ruta es protegida
    static async getAll(req: AuthRequest, res: Response) {
        try {
            const homes = await HomeModel.findAll();
            res.json({
                success: true,
                data: homes,
                count: homes.length
            });
        } catch (error: any) {
            console.error('❌ Error en HomeController.getAll:', error.message);
            res.status(500).json({ success: false, message: 'Error al obtener fraternidades' });
        }
    }
    
    static async getById(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
            
            const home = await HomeModel.findById(id);
            if (!home) return res.status(404).json({ success: false, message: 'Fraternidad no encontrada' });
            
            res.json({ success: true, data: home });
        } catch (error: any) {
            console.error('❌ Error en HomeController.getById:', error.message);
            res.status(500).json({ success: false, message: 'Error al obtener fraternidad' });
        }
    }

    static async getAllImgById(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

            const images = await HomeImageModel.findByHomeId(id);
            res.json({
                success: true,
                data: images || [],
                count: images?.length || 0
            });
        } catch (error: any) {
            console.error('❌ Error en HomeController.getAllImgById:', error.message);
            res.status(500).json({ success: false, message: 'Error al obtener imágenes' });
        }
    }
    
    static async update(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
            
            const updateData: Partial<Home> = { ...req.body };
            
            // Asegurar que los IDs sean enteros
            if (req.body.guardian) updateData.guardian = parseInt(req.body.guardian);
            if (req.body.parish_priest) updateData.parish_priest = parseInt(req.body.parish_priest);
            if (req.body.communication_user) updateData.communication_user = parseInt(req.body.communication_user);
            
            const updatedHome = await HomeModel.update(id, updateData);
            if (!updatedHome) return res.status(404).json({ success: false, message: 'No encontrado' });
            
            res.json({ success: true, message: 'Actualizado exitosamente', data: updatedHome });
        } catch (error: any) {
            console.error('❌ Error en HomeController.update:', error.message);
            res.status(500).json({ success: false, message: 'Error al actualizar' });
        }
    }
    
    static async delete(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

            const images = await GroupsImageModel.findById(id);
            console.log(images);
           

            
            /*const deleted = await HomeModel.delete(id);
            if (!deleted) return res.status(404).json({ success: false, message: 'No encontrada' });*/
            
            res.json({ success: true, message: 'Eliminada exitosamente' });
        } catch (error: any) {
            console.error('❌ Error en HomeController.delete:', error.message);
            res.status(500).json({ success: false, message: 'Error al eliminar' });
        }
    }

    // CORRECCIÓN CRÍTICA: Cambiado a AuthRequest para req.user?.id_brotther
    static async createImgHome(req: AuthRequest, res: Response) {
        uploadSingle(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            try {
                if (!req.file) return res.status(400).json({ success: false, message: 'No hay imagen' });

                const { home_id, orderimg } = req.body;
                // Aquí ya no dará error porque req es AuthRequest
                const id_brotther = req.user?.id_brotther || 0;

                const imageUrl = await AWSS3Service.uploadHomeImage(req.file);
                
                const newImage = await HomeImageModel.create({
                    home_id: parseInt(home_id),
                    url_img: imageUrl,
                    orderimg: orderimg ? parseInt(orderimg) : 1,
                    created_by: id_brotther
                });

                return res.status(201).json({ success: true, data: newImage });

            } catch (innerError: any) {
                return res.status(500).json({ success: false, message: innerError.message });
            }
        });
    }

    static async deleteImgHome(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const searchImg = await HomeImageModel.findById(id);
            if (!searchImg) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });

            if (searchImg.url_img) await AWSS3Service.deleteImage(searchImg.url_img); 
            
            await HomeImageModel.delete(id);
            res.status(200).json({ success: true, message: 'Imagen eliminada' });

        } catch (error: any) {
            console.error('❌ Error en deleteImgHome:', error);
            res.status(500).json({ success: false, message: 'Error interno' });
        }
    }

    static async updateImgOrder(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { orderimg } = req.body;
            
            if (isNaN(id) || !orderimg) return res.status(400).json({ success: false, message: 'Datos requeridos faltantes' });

            res.json({ success: true, message: 'Orden actualizado exitosamente' });
        } catch (error: any) {
            res.status(500).json({ success: false, message: 'Error interno' });
        }
    }
}