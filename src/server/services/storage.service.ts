import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env";

export interface StoredFileResult {
  storageRef: string;
  filename: string;
  originalFilename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  save(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileResult>;
  get(storageRef: string): Promise<Buffer>;
  delete(storageRef: string): Promise<boolean>;
  getUrl(storageRef: string): string;
}

export class LocalDiskStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = env.UPLOAD_DIR;
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public async save(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<StoredFileResult> {
    this.ensureDirectory();

    const ext = path.extname(originalFilename).toLowerCase();
    const safeBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const uniqueFilename = `${safeBase}_${Date.now()}_${uniqueId}${ext}`;
    const destinationPath = path.join(this.uploadDir, uniqueFilename);

    await fs.promises.writeFile(destinationPath, fileBuffer);

    return {
      storageRef: uniqueFilename,
      filename: uniqueFilename,
      originalFilename,
      url: `/uploads/${uniqueFilename}`,
      size: fileBuffer.length,
      mimeType,
    };
  }

  public async get(storageRef: string): Promise<Buffer> {
    const safeRef = path.basename(storageRef);
    const filePath = path.join(this.uploadDir, safeRef);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${safeRef}`);
    }
    return fs.promises.readFile(filePath);
  }

  public async delete(storageRef: string): Promise<boolean> {
    try {
      const safeRef = path.basename(storageRef);
      const filePath = path.join(this.uploadDir, safeRef);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public getUrl(storageRef: string): string {
    const safeRef = path.basename(storageRef);
    return `/uploads/${safeRef}`;
  }
}

export const storageService = new LocalDiskStorageProvider();
