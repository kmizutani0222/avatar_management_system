import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { MAX_VRM_SIZE_BYTES, MAX_VRM_SIZE_MB } from '../common/constants';

@Injectable()
export class StorageService implements OnModuleInit {
  private client!: S3Client;
  private bucket!: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.config.get<string>('MINIO_PORT', '9000');
    const useSsl = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';

    this.bucket = this.config.get<string>('MINIO_BUCKET', 'avatars');

    this.client = new S3Client({
      endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.get<string>('MINIO_ROOT_USER', 'minioadmin'),
        secretAccessKey: this.config.get<string>('MINIO_ROOT_PASSWORD', 'minioadmin'),
      },
    });

    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  validateVrmFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('VRM file is required');
    if (file.size > MAX_VRM_SIZE_BYTES) {
      throw new BadRequestException(`VRM file must be ${MAX_VRM_SIZE_MB}MB or less`);
    }
    const name = file.originalname.toLowerCase();
    if (!name.endsWith('.vrm')) {
      throw new BadRequestException('File must have .vrm extension');
    }
    const header = file.buffer.subarray(0, 4).toString('utf8');
    if (!header.startsWith('glTF')) {
      throw new BadRequestException('Invalid VRM/glTF file format');
    }
  }

  async uploadVrm(userId: string, file: Express.Multer.File): Promise<string> {
    this.validateVrmFile(file);
    const key = `avatars/${userId}/${randomUUID()}.vrm`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: 'model/vrm',
      }),
    );

    return key;
  }

  async getObject(key: string): Promise<{ body: Buffer; contentType: string }> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new BadRequestException('Model not found in storage');
    return {
      body: Buffer.from(bytes),
      contentType: res.ContentType ?? 'model/vrm',
    };
  }

  extractKeyFromModelUrl(modelUrl: string): string | null {
    const prefix = `/${this.bucket}/`;
    const idx = modelUrl.indexOf(prefix);
    if (idx === -1) return modelUrl.startsWith('avatars/') ? modelUrl : null;
    return modelUrl.slice(idx + prefix.length);
  }
}
