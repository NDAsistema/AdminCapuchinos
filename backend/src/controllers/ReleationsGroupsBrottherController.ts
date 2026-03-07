import { Request, Response } from 'express';
import { ReleationsGroupsBrottherModel } from '../models/ReleationsGroupsBrottherModel';

export class ReleationsGroupsBrottherController {
    static async create(req: Request, res: Response) {
        try {
            const newReleationsGroupsBrotther = await ReleationsGroupsBrottherModel.create(req.body);
            res.json({ success: true, data: newReleationsGroupsBrotther });
        } catch (error) {
            console.error('Error creating releations groups brotther:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const updatedReleationsGroupsBrotther = await ReleationsGroupsBrottherModel.update(req.params.id, req.body);
            res.json({ success: true, data: updatedReleationsGroupsBrotther });
        } catch (error) {
            console.error('Error updating releations groups brotther:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const deletedReleationsGroupsBrotther = await ReleationsGroupsBrottherModel.delete(req.params.id);
            res.json({ success: true, data: deletedReleationsGroupsBrotther });
        } catch (error) {
            console.error('Error deleting releations groups brotther:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const releationsGroupsBrotther = await ReleationsGroupsBrottherModel.findAll();
            res.json({ success: true, data: releationsGroupsBrotther });
        } catch (error) {
            console.error('Error getting releations groups brotther:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const releationsGroupsBrotther = await ReleationsGroupsBrottherModel.findById(req.params.id);
            res.json({ success: true, data: releationsGroupsBrotther });
        } catch (error) {
            console.error('Error getting releations groups brotther:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}
