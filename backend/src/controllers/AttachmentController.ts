import { Request, Response } from 'express';
import { AttachmentModel } from '../models/attachment.model';
import AWSS3Service from '../services/awsS3Service';
import { SaintAttachmentModel } from '../models/SaintAttachmentModel';
import { AuthController } from './authController';

export class AttachmentController {

    /**
     * Saved img from Froala editor to S3 and create attachment record in DB
     */
    static async uploadFromEditor(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se recibió ninguna imagen' });
            }
            const imageUrl = await AWSS3Service.uploadNewspapersImage(req.file);
            const fileName = imageUrl.split('/').pop() || `news_${Date.now()}`;
            const created_by = AuthController.getUserId(req);
            await AttachmentModel.create({
                url: imageUrl,
                filename: fileName,
                type: 1,
                created_by: created_by
            });
            return res.json({ link: imageUrl });

        } catch (error) {
            console.error('❌ Error en AttachmentController:', error);
            return res.status(500).json({ error: 'Error al procesar la imagen en S3' });
        }
    }

    /**
     * Saved img from Froala editor to S3 and create attachment record in DB
     */
    static async uploadFromEditorTask(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se recibió ninguna imagen' });
            }
            const imageUrl = await AWSS3Service.uploadTaskImage(req.file);
            const fileName = imageUrl.split('/').pop() || `task_${Date.now()}`;
            const created_by = AuthController.getUserId(req);
            await AttachmentModel.create({
                url: imageUrl,
                filename: fileName,
                type: 2,
                created_by: created_by
            });
            return res.json({ link: imageUrl });

        } catch (error) {
            console.error('❌ Error en AttachmentController:', error);
            return res.status(500).json({ error: 'Error al procesar la imagen en S3' });
        }
    }

    static async uploadFromEditorSaint(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se recibió ninguna imagen' });
            }
            const imageUrl = await AWSS3Service.uploadSaintImage(req.file);
            const fileName = imageUrl.split('/').pop() || `saint_${Date.now()}`;
            const created_by = AuthController.getUserId(req);
            await SaintAttachmentModel.create({
                url: imageUrl,
                filename: fileName,
                created_by: created_by,
            });
            return res.json({ link: imageUrl });
        } catch (error) {
            console.error('❌ Error en uploadFromEditorSaint:', error);
            return res.status(500).json({ error: 'Error al procesar la imagen en S3' });
        }
    }

    /**
     * Función para vincular imágenes al guardar la noticia definitiva
     */
    static extractAndBindImages = async (newspaperId: number, htmlContent: string) => {
        const imageRegex = /https:\/\/[^"\s]+\.(?:jpg|jpeg|png|gif)/g;
        const urlsFound = htmlContent.match(imageRegex) || [];
        if (urlsFound.length > 0) {
            await AttachmentModel.bindToNewspaper(newspaperId, urlsFound);
        }
    };
}