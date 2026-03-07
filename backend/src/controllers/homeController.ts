// src/controllers/HomeController.ts
import { Request, Response } from 'express';
import { HomeModel, Home } from '../models/HomeModel';
import { HomeImageModel, HomeImage } from '../models/HomeImageModel';
import { uploadSingle } from '../middleware/uploadMiddleware'; // Usar el mismo middleware
import AWSS3Service from '../services/awsS3Service';

export class HomeController {
    
    static async create(req: Request, res: Response) {
        try {
            const createBy = req.user?.id_brotther || 0;
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
    
    static async getAll(req: Request, res: Response) {
        try {
            const homes = await HomeModel.findAll();
            
            res.json({
                success: true,
                data: homes,
                count: homes.length
            });
            
        } catch (error: any) {
            console.error('❌ Error en HomeController.getAll:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al obtener fraternidades'
            });
        }
    }
    
    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }
            
            const home = await HomeModel.findById(id);
            
            if (!home) {
                return res.status(404).json({
                    success: false,
                    message: 'Fraternidad no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: home
            });
            
        } catch (error: any) {
            console.error('❌ Error en HomeController.getById:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al obtener fraternidad'
            });
        }
    }

    static async getAllImgById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }

            const images = await HomeImageModel.findByHomeId(id);
            
            if (!images || images.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No hay imágenes para esta fraternidad'
                });
            }
           
            res.json({
                success: true,
                data: images,
                count: images.length
            });
            
        } catch (error: any) {
            console.error('❌ Error en HomeController.getAllImgById:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al obtener imágenes de la fraternidad'
            });
        }
    }
    
    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }
            
            console.log(`🟢 Actualizando fraternidad ID: ${id}`, req.body);
            
            const updateData: Partial<Home> = { ...req.body };
            
            if (req.body.guardian !== undefined) updateData.guardian = parseInt(req.body.guardian);
            if (req.body.parish_priest !== undefined) updateData.parish_priest = parseInt(req.body.parish_priest);
            if (req.body.communication_user !== undefined) updateData.communication_user = parseInt(req.body.communication_user);
            
            const updatedHome = await HomeModel.update(id, updateData);
            
            if (!updatedHome) {
                return res.status(404).json({
                    success: false,
                    message: 'Fraternidad no encontrada'
                });
            }
            
            console.log(`✅ Fraternidad actualizada: ${updatedHome.name}`);
            
            res.json({
                success: true,
                message: 'Fraternidad actualizada exitosamente',
                data: updatedHome
            });
            
        } catch (error: any) {
            console.error('❌ Error en HomeController.update:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar fraternidad'
            });
        }
    }
    
    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido'
                });
            }
            
            const deleted = await HomeModel.delete(id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Fraternidad no encontrada'
                });
            }
            
            res.json({
                success: true,
                message: 'Fraternidad eliminada exitosamente'
            });
            
        } catch (error: any) {
            console.error('❌ Error en HomeController.delete:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar fraternidad'
            });
        }
    }

    // Usa el MISMO middleware que brother (upload.single('img'))
    static async createImgHome(req: Request, res: Response) {
        try {
            uploadSingle(req, res, async (err) => {
                if (err) {
                    console.error('❌ Error de Multer:', err);
                    return res.status(400).json({ 
                        success: false, 
                        message: `Error al subir la imagen: ${err.message}` 
                    });
                }

                try {
                    if (!req.file) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'No se recibió ninguna imagen' 
                        });
                    }

                    const { home_id, orderimg } = req.body;
                    const id_brotther = req.user?.id_brotther || 0;

                    console.log('📊 Datos recibidos:', { 
                        home_id, 
                        orderimg, 
                        id_brotther,
                        fileName: req.file.originalname 
                    });

                    if (!home_id) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'El ID del home es requerido' 
                        });
                    }

                    const imageUrl = await AWSS3Service.uploadHomeImage(req.file);
                    const homeIdNum = parseInt(home_id.toString());
                    const orderNum = orderimg ? parseInt(orderimg.toString()) : 1;
                    const newImage = await HomeImageModel.create({
                        home_id: homeIdNum,
                        url_img: imageUrl,
                        orderimg: orderNum,
                        created_by: id_brotther
                    });
                    return res.status(201).json({
                        success: true,
                        message: 'Imagen subida correctamente',
                        data: newImage
                    });

                } catch (innerError: any) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error interno: ' + innerError.message
                    });
                }
            });

        } catch (outerError: any) {
            console.error('❌ Error general en createImgHome:', outerError);
            
            return res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor'
            });
        }
    }

    // ==================== MÉTODO PARA ELIMINAR IMAGEN DE HOME ====================
    static async deleteImgHome(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const searchImg = await HomeImageModel.findById(id);
            if (!searchImg) {
                return res.status(404).json({
                    success: false,
                    message: 'Imagen no encontrada'
                });
            }
            if (searchImg.url_img) {
                await AWSS3Service.deleteImage(searchImg.url_img); 
            }
            const deleted = await HomeImageModel.delete(id);
            if (deleted) {
                return res.status(200).json({
                    success: true,
                    message: 'Imagen eliminada correctamente'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Error al eliminar la imagen'
                });
            }

        } catch (error: any) {
            console.error('❌ Error en deleteImgHome:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async updateImgOrder(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const { orderimg } = req.body;
            
            if (isNaN(id) || !orderimg) {
                return res.status(400).json({
                    success: false,
                    message: 'ID y orderimg son requeridos'
                });
            }

            console.log(`🔄 Actualizando orden imagen ID: ${id} a orden: ${orderimg}`);

            // const updated = await HomeImageModel.updateOrder(id, parseInt(orderimg));
            
            // if (!updated) {
            //     return res.status(404).json({
            //         success: false,
            //         message: 'Imagen no encontrada o error al actualizar'
            //     });
            // }

            res.json({
                success: true,
                message: 'Orden de imagen actualizado exitosamente'
            });

        } catch (error: any) {
            console.error('❌ Error en updateImgOrder:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}