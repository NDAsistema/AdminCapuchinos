// src/controllers/brotherController.ts
import { Request, Response } from 'express';
import { BrotherModel, Brother } from '../models/BrotherModel';
import { UserModel, User } from '../models/UserModel';
import { TypeUserServicesModel, TypeUserServices } from '../models/TypeUserServicesModel';
import { uploadSingle } from '../middleware/uploadMiddleware';
import AWSS3Service from '../services/awsS3Service';
import { AuthRequest } from '../middleware/authMiddleware'; 

export class BrotherController {

    // Crear nuevo hermano - CORREGIDO
    // CREAR hermano - VERSIÓN SUPER SIMPLE
    static async create(req: AuthRequest, res: Response) {
        try {
            uploadSingle(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                const created_by = req.user?.id || 0;
                const { name, email, birth_date, study, cv, server, year_profession } = req.body;
                
                if (!name || !email) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nombre y email son requeridos'
                    });
                }

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'La imagen de perfil es requerida'
                    });
                }

                const existingBrother = await BrotherModel.findByEmail(email);
                if (existingBrother) {
                    return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                    });
                }

                const imageUrl = await AWSS3Service.uploadImage(req.file);

                const brotherData = {
                    name, email, birth_date, study, cv, server, year_profession, created_by,
                    img: imageUrl  
                };

                const newBrother = await BrotherModel.create(brotherData);
                res.status(201).json({
                    success: true,
                    message: 'Hermano creado exitosamente',
                    data: newBrother
                });
            });

        } catch (error) {
            console.error('Error creating brother:', error);
                res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Los demás métodos permanecen igual...
    static async getAll(req: Request, res: Response) {
        try {
            const brothers = await BrotherModel.findAll();

            res.json({
                success: true,
                data: brothers,
                count: brothers.length
            });

        } catch (error) {
            console.error('Error getting brothers:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    static async getListTypeUserServices(req: Request, res: Response) {
        try {
            const brothers = await BrotherModel.getListTypeUserServices();
            res.json({
                success: true,
                data: brothers,
                count: brothers.length
            });
        } catch (error) {
            console.error('Error getting brothers for guardian:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }   
    }
    
    static async findBrothersForGuardian(req: Request, res: Response) {
        try {
            const brothers = await BrotherModel.findBrothersForGuardian();
            res.json({
                success: true,
                data: brothers,
                count: brothers.length
            });
        } catch (error) {
            console.error('Error getting brothers for guardian:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }   
    }

    static async findBrothersForParishPriest(req: Request, res: Response) {
        try {
            const brothers = await BrotherModel.findBrothersForParishPriest();
            res.json({
                success: true,
                data: brothers,
                count: brothers.length
            });
        } catch (error) {
            console.error('Error getting brothers for guardian:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }   
    }

    static async findBrothersForCommunicationUser(req: Request, res: Response) {
        try {
            const brothers = await UserModel.findListUsersType(3);
            res.json({
                success: true,
                data: brothers,
                count: brothers.length
            });
        }
        catch (error) {
            console.error('Error getting brothers for communication user:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
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

            const brother = await BrotherModel.findById(id);
            
            if (!brother) {
                return res.status(404).json({
                success: false,
                message: 'Hermano no encontrado'
                });
            }

            res.json({
                success: true,
                data: brother
            });

        } catch (error) {
            console.error('Error getting brother:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    
    static async update(req: AuthRequest, res: Response) {
        try {
            uploadSingle(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                const created_by = req.user?.id || 0;
                const id = parseInt(req.params.id);
                
                if (isNaN(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'ID inválido'
                    });
                }

                const existingBrother = await BrotherModel.findById(id);
                if (!existingBrother) {
                    return res.status(404).json({
                        success: false,
                        message: 'Hermano no encontrado'
                    });
                }

                const { name, email, birth_date, study, cv, server, year_profession } = req.body;
                
                if (!name || !email) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nombre y email son requeridos'
                    });
                }

                if (email !== existingBrother.email) {
                    const brotherWithEmail = await BrotherModel.findByEmail(email);
                    if (brotherWithEmail && brotherWithEmail.id !== id) {
                        return res.status(409).json({
                            success: false,
                            message: 'El email ya está registrado por otro hermano'
                        });
                    }
                }

                const updateData: any = {
                    name, 
                    email, 
                    birth_date, 
                    study, 
                    cv, 
                    server, 
                    year_profession,
                    created_by
                };

                if (req.file) {
                    if (existingBrother.img) {
                        try {
                            await AWSS3Service.deleteImage(existingBrother.img);
                        } catch (deleteError) {
                            console.error('Error eliminando imagen anterior de S3:', deleteError);
                        }
                    }

                    const imageUrl = await AWSS3Service.uploadImage(req.file);
                    updateData.img = imageUrl;
                    console.log('Nueva imagen subida a S3:', imageUrl);
                }

                // Actualizar el hermano en la base de datos
                const updatedBrother = await BrotherModel.update(id, updateData);
                
                if (!updatedBrother) {
                    return res.status(404).json({
                        success: false,
                        message: 'Error al actualizar el hermano'
                    });
                }

                res.json({
                    success: true,
                    message: 'Hermano actualizado exitosamente',
                    data: updatedBrother
                });
            });

        } catch (error) {
            console.error('Error updating brother:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
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
            const existingBrother = await BrotherModel.findById(id);
            if (!existingBrother) {
                return res.status(404).json({
                    success: false,
                    message: 'Hermano no encontrado'
                });
            }
            if (existingBrother.img) {
                try {
                    await AWSS3Service.deleteImage(existingBrother.img);
                } catch (deleteError) {
                    console.error('Error eliminando imagen anterior de S3:', deleteError);
                }
            }

            const deleted = await BrotherModel.delete(id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Error al eliminar el hermano'
                });
            }

            res.json({
                success: true,
                message: 'Hermano eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error deleting brother:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Buscar listado de hermanos para crear usuariso 
     */

    static async searchListBrotherByCreateUsers(req: Request, res: Response) {
        try {
            const brothers = await BrotherModel.searchListBrotherByCreateUsers();
            res.json({
                success: true,
                data: brothers
            });
        }catch (error) {
            console.error('Error getting brothers for create user:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    
}