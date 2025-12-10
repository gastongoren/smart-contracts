export interface UploadFileParams {
  buffer: Buffer;
  contentType: string;
  ext?: string;
  userId?: string;
  reqTenant?: { id: string };
}

export interface UploadFileResult {
  key: string;
  bucket: string;
  url: string;
  tenantId: string;
}

export interface PresignedUrlParams {
  contentType?: string;
  ext?: string;
  userId?: string;
  expiresIn?: number;
  reqTenant?: { id: string };
}

export interface PresignedPutUrlResult {
  url: string;
  key: string;
  bucket: string;
  contentType: string;
  expiresIn: number;
  tenantId: string;
  mock?: boolean;
}

export interface PresignedGetUrlParams extends PresignedUrlParams {
  key: string;
}

export interface PresignedGetUrlResult {
  url: string;
  expiresIn: number;
  bucket: string;
}

export interface GetObjectBufferParams {
  key: string;
  reqTenant?: { id: string };
}

export interface IStorageService {
  uploadFile(params: UploadFileParams): Promise<UploadFileResult>;
  createPresignedPutUrl(params: PresignedUrlParams): Promise<PresignedPutUrlResult>;
  createPresignedGetUrl(params: PresignedGetUrlParams): Promise<PresignedGetUrlResult>;
  getObjectBuffer(params: GetObjectBufferParams): Promise<Buffer>;
}

