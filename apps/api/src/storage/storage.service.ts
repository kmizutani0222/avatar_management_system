import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

  async uploadBakedModel(
    userId: string,
    buffer: Buffer,
    format: 'vrm' | 'glb',
  ): Promise<string> {
    const key = `avatars/${userId}/${randomUUID()}.${format}`;
    const contentType = format === 'vrm' ? 'model/vrm' : 'model/gltf-binary';

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return key;
  }

  async uploadThumbnail(userId: string, buffer: Buffer): Promise<string> {
    const key = `thumbnails/${userId}/${randomUUID()}.png`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/png',
      }),
    );

    return key;
  }

  validateProfileIconFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Profile icon file is required');
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException('Profile icon must be 2MB or less');
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Profile icon must be PNG, JPEG, WebP, or GIF');
    }
  }

  async uploadProfileIcon(userId: string, file: Express.Multer.File): Promise<string> {
    this.validateProfileIconFile(file);
    const ext =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : file.mimetype === 'image/gif'
            ? 'gif'
            : 'jpg';
    const key = `profile-icons/${userId}/${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  baseTemplateKey(bodyType: string): string {
    // v4: humanoid body is a SkinnedMesh with vertex weights (Phase 17)
    return `templates/${bodyType}/base-v4.glb`;
  }

  partAssetKey(partId: string): string {
    return `parts/${partId}/asset.glb`;
  }

  validateGlbFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('GLB file is required');
    if (file.size > MAX_VRM_SIZE_BYTES) {
      throw new BadRequestException(`GLB file must be ${MAX_VRM_SIZE_MB}MB or less`);
    }
    const name = file.originalname.toLowerCase();
    if (!name.endsWith('.glb') && !name.endsWith('.gltf')) {
      throw new BadRequestException('File must have .glb or .gltf extension');
    }
    const header = file.buffer.subarray(0, 4).toString('utf8');
    if (!header.startsWith('glTF')) {
      throw new BadRequestException('Invalid glTF/GLB file format');
    }
  }

  async uploadPartAsset(partId: string, buffer: Buffer): Promise<string> {
    const key = this.partAssetKey(partId);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'model/gltf-binary',
      }),
    );
    return key;
  }

  async uploadBaseTemplate(bodyType: string, buffer: Buffer): Promise<string> {
    const key = this.baseTemplateKey(bodyType);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'model/gltf-binary',
      }),
    );
    return key;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getObjectOrNull(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      return await this.getObject(key);
    } catch {
      return null;
    }
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

  async ping(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedModelUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  extractKeyFromModelUrl(modelUrl: string): string | null {
    const prefix = `/${this.bucket}/`;
    const idx = modelUrl.indexOf(prefix);
    if (idx === -1) return modelUrl.startsWith('avatars/') ? modelUrl : null;
    return modelUrl.slice(idx + prefix.length);
  }
}
