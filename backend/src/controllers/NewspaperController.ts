import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware'; 
import { NewspaperModel } from '../models/NewspaperModel';
import { AttachmentController } from './attachmentController'; 
import AWSS3Service from '../services/awsS3Service';
import { AuthController } from './authController';

export class NewspaperController {

    // Asegúrate de que se llame findAll y sea static
    static async findAll(req: AuthRequest, res: Response) {
        try {
            const newspapers = await NewspaperModel.findAll();
            return res.json({ success: true, data: newspapers });
        } catch (error: any) {
            console.error('❌ Error en findAll:', error.message);
            return res.status(500).json({ success: false, message: 'Error al obtener noticias' });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const { title, content, type_news, type_assing, idAssing } = req.body;
            const file = req.file; 
            
            const created_by = AuthController.getUserId(req); 
            
            let imageUrl = null;

            if (file) {
                imageUrl = await AWSS3Service.uploadNewspapersImage(file);
            }

            const newNews = await NewspaperModel.create({
                title,
                content,
                img: imageUrl,
                type_news: parseInt(type_news),
                type_assing: parseInt(type_assing), 
                sub_type_assing: parseInt(idAssing),
                status: 1,
                created_by: Number(created_by)
            });

            if (newNews && newNews.id) {
                await AttachmentController.extractAndBindImages(newNews.id, content);
            }

            return res.status(201).json({ success: true, data: newNews });

        } catch (error: any) {
            console.error('❌ Error en create news:', error.message);
            return res.status(500).json({ success: false, message: 'Error al crear noticia' });
        }   
    }

    static async update(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { title, content, type_news, type_assing, idAssing } = req.body;
            const file = req.file;

            // 1. Buscar la noticia actual para saber si tiene una imagen previa
            const existingNews = await NewspaperModel.findById(parseInt(id));
            if (!existingNews) {
                return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
            }

            let imageUrl = existingNews.img; // Por defecto mantenemos la actual

            if (file) {
                try {
                    imageUrl = await AWSS3Service.uploadNewspapersImage(file);
                    if (existingNews.img) {
                        try {
                            await AWSS3Service.deleteImage(existingNews.img);
                            console.log('✅ Imagen vieja eliminada de S3');
                        } catch (s3DeleteError: any) {
                            console.error('⚠️ Error al borrar imagen vieja de S3:', s3DeleteError.message);
                        }
                    }
                } catch (s3UploadError: any) {
                    console.error('❌ Error S3 Nueva Imagen:', s3UploadError.message);
                    return res.status(500).json({ success: false, message: 'Error al subir la nueva imagen' });
                }
            }

            const updated = await NewspaperModel.update(parseInt(id), {
                title,
                content,
                img: imageUrl,
                type_news: parseInt(type_news),
                type_assing: parseInt(type_assing),
                sub_type_assing: parseInt(idAssing)
            });

            if (updated) {
                await AttachmentController.extractAndBindImages(parseInt(id), content);
            }

            return res.json({
                success: true,
                message: 'Noticia actualizada correctamente',
                data: { id, title, img: imageUrl }
            });

        } catch (error: any) {
            console.error('❌ Error en update news:', error.message);
            res.status(500).json({ success: false, message: 'Error interno al actualizar' });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const created_by = AuthController.getUserId(req); 
            const deleted = await NewspaperModel.delete(parseInt(id), created_by);
            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
            }
            return res.json({ success: true, message: 'Noticia eliminada correctamente' });
        } catch (error: any) {
            console.error('❌ Error en delete news:', error.message);
            res.status(500).json({ success: false, message: 'Error interno al eliminar' });
        }
    }
}