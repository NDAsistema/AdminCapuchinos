import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware'; 
import { NewspaperModel } from '../models/NewspaperModel';
import { AttachmentController } from './AttachmentController'; 
import AWSS3Service from '../services/awsS3Service';
import { AuthController } from './authController';
import { slugify } from '../utils/slugify';

export class NewspaperController {

    static async findAll(req: AuthRequest, res: Response) {
        try {
            const newspapers = await NewspaperModel.findAll();
            return res.json({ success: true, data: newspapers });
        } catch (error: any) {
            console.error('❌ Error en findAll:', error.message);
            return res.status(500).json({ success: false, message: 'Error al obtener noticias' });
        }
    }

    static async findBySlug(req: AuthRequest, res: Response) {
        try {
            const { slug } = req.params;
            if (!slug?.trim()) {
                return res.status(400).json({ success: false, message: 'Slug requerido' });
            }

            const newspaper = await NewspaperModel.findBySlug(slug);
            if (!newspaper) {
                return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
            }

            return res.json({ success: true, data: newspaper });
        } catch (error: any) {
            console.error('❌ Error en findBySlug:', error.message);
            return res.status(500).json({ success: false, message: 'Error al obtener noticia' });
        }
    }

    static async create(req: AuthRequest, res: Response) {
        try {
            const { title, content, type_news, type_assing, idAssing, slug: slugFromBody } = req.body;
            const file = req.file; 
            
            const created_by = AuthController.getUserId(req); 
            
            let imageUrl = null;

            if (file) {
                imageUrl = await AWSS3Service.uploadNewspapersImage(file);
            }

            // Slug opcional desde el admin; si no viene, se genera desde el título
            const newNews = await NewspaperModel.create({
                title,
                slug: slugFromBody?.trim() ? slugify(slugFromBody) : undefined,
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
            const { title, content, type_news, type_assing, idAssing, slug: slugFromBody, update_slug } = req.body;
            const file = req.file;
            const newsId = parseInt(id);

            const existingNews = await NewspaperModel.findById(newsId);
            if (!existingNews) {
                return res.status(404).json({ success: false, message: 'Noticia no encontrada' });
            }

            let imageUrl = existingNews.img;

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

            const payload: Record<string, unknown> = {
                title,
                content,
                img: imageUrl,
                type_news: parseInt(type_news),
                type_assing: parseInt(type_assing),
                sub_type_assing: parseInt(idAssing)
            };

            // Regenerar slug si:
            // - update_slug === 'true' / true, o
            // - se envía un slug distinto, o
            // - el título cambió y no se pide mantener el slug (por defecto se regenera si cambió el título)
            const shouldUpdateSlug =
                update_slug === true ||
                update_slug === 'true' ||
                (typeof slugFromBody === 'string' && slugFromBody.trim() !== '' && slugify(slugFromBody) !== existingNews.slug) ||
                (title !== existingNews.title && update_slug !== false && update_slug !== 'false');

            let nextSlug = existingNews.slug;

            if (shouldUpdateSlug) {
                const base = (typeof slugFromBody === 'string' && slugFromBody.trim())
                    ? slugify(slugFromBody)
                    : slugify(title);
                nextSlug = await NewspaperModel.generateUniqueSlug(base, newsId, true);
                payload.slug = nextSlug;
            }

            const updated = await NewspaperModel.update(newsId, payload as any);

            if (updated) {
                await AttachmentController.extractAndBindImages(newsId, content);
            }

            return res.json({
                success: true,
                message: 'Noticia actualizada correctamente',
                data: { id: newsId, title, slug: nextSlug, img: imageUrl }
            });

        } catch (error: any) {
            console.error('❌ Error en update news:', error.message);
            res.status(500).json({ success: false, message: 'Error interno al actualizar' });
        }
    }
}
