import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export class AWSS3Service {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        });
        this.bucketName = process.env.AWS_S3_BUCKET_NAME!;
    }

    // Subir imagen a S3
    async uploadImage(file: Express.Multer.File): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const key = `brothers/profiles/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);
        
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

     // Subir imagen a S3
    async uploadHomeImage(file: Express.Multer.File): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const key = `Homes/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);
        
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    async uploadIconGroupImage(file: Express.Multer.File): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const key = `IconGroups/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);
        
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    async uploadGroupImage(id_group:string, file: Express.Multer.File): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const key = `Groups/${id_group}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);
        
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    async uploadNewspapersImage(file: Express.Multer.File): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const key = `Newspapers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);
        
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    async deleteIconGroupImage(imageUrl: string): Promise<void> {
        try {
            const parts = imageUrl.split('.amazonaws.com/');
            
            if (parts.length < 2) {
                console.warn('⚠️ URL de imagen no válida para S3:', imageUrl);
                return;
            }

            const key = decodeURIComponent(parts[1]);

            console.log('🗑️ Intentando eliminar Key de S3:', key);

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            console.log('✅ Imagen eliminada de S3 con éxito');
        } catch (error) {
            console.error('❌ Error al eliminar objeto de S3:', error);
            throw error; 
        }
    }

    // Eliminar imagen de S3
    async deleteImage(imageUrl: string): Promise<void> {
        const key = imageUrl.split('.amazonaws.com/')[1];
        
        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.s3Client.send(command);
    }

    // Extraer key de S3 desde URL (para eliminar)
    extractKeyFromUrl(imageUrl: string): string {
        return imageUrl.split('.amazonaws.com/')[1];
    }
}

export default new AWSS3Service();