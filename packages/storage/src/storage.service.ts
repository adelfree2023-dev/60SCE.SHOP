import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private s3: S3Client;

    constructor() {
        this.s3 = new S3Client({
            endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
            region: 'us-east-1',
            credentials: {
                accessKeyId: process.env.MINIO_ACCESS_KEY || 'admin',
                secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio2026',
            },
            forcePathStyle: true,
        });
    }

    async onModuleInit() {
        this.logger.log('✅ MinIO storage client initialized');
    }

    async uploadFile(
        bucket: string,
        key: string,
        fileBuffer: Buffer,
        contentType: string = 'application/octet-stream'
    ): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: fileBuffer,
                ContentType: contentType,
            });

            await this.s3.send(command);
            const url = `${process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'}/${bucket}/${key}`;
            this.logger.log(`File uploaded: ${url}`);
            return url;
        } catch (error: any) {
            this.logger.error(`Upload failed: ${error.message}`);
            throw error;
        }
    }

    async getFileUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const url = await getSignedUrl(this.s3, command, { expiresIn });
        return url;
    }

    async deleteFile(bucket: string, key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        await this.s3.send(command);
        this.logger.log(`File deleted: ${bucket}/${key}`);
    }

    async createBucket(bucket: string): Promise<void> {
        try {
            const command = new CreateBucketCommand({ Bucket: bucket });
            await this.s3.send(command);
            this.logger.log(`Bucket created: ${bucket}`);
        } catch (error: any) {
            if (error.name === 'BucketAlreadyOwnedByYou') {
                this.logger.log(`Bucket already exists: ${bucket}`);
            } else {
                throw error;
            }
        }
    }

    async listFiles(bucket: string, prefix?: string): Promise<any[]> {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
        });

        const response = await this.s3.send(command);
        return response.Contents || [];
    }
}
