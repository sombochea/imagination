
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { StorageSettings } from "../types";

const STORAGE_CONFIG_KEY = 'imagination_studio_storage_config';

export const getStorageSettings = (): StorageSettings => {
  const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse storage settings", e);
    }
  }
  return {
    provider: 'local',
    region: 'us-east-1',
    bucket: ''
  };
};

export const saveStorageSettings = (settings: StorageSettings) => {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(settings));
};

export const assetStore = {
  uploadBase64: async (base64Data: string, type: 'image' | 'audio' | 'video'): Promise<string> => {
    const settings = getStorageSettings();

    // 1. Local Mode (Fallback or Default)
    if (settings.provider === 'local') {
      // In local mode, we just return the base64 string.
      // Ideally, we might use IndexedDB to store the blob and return a blob ID,
      // but keeping base64 keeps the architecture simple for this demo without a backend.
      return base64Data;
    }

    // 2. Cloud Mode (S3/R2/GCS)
    try {
      if (!settings.bucket || !settings.accessKeyId || !settings.secretAccessKey) {
        throw new Error("Missing cloud storage credentials");
      }

      // Convert Base64 to Buffer/Blob
      const base64Content = base64Data.replace(/^data:.*?;base64,/, "");
      const mimeType = base64Data.match(/^data:([^;]+);/)?.[1] || (type === 'image' ? 'image/png' : type === 'audio' ? 'audio/wav' : 'video/mp4');
      const binaryString = atob(base64Content);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Generate Filename
      const ext = mimeType.split('/')[1];
      const filename = `assets/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      // Initialize S3 Client
      const clientConfig: any = {
        region: settings.region,
        credentials: {
          accessKeyId: settings.accessKeyId,
          secretAccessKey: settings.secretAccessKey,
        },
      };

      if (settings.endpoint) {
        clientConfig.endpoint = settings.endpoint;
      }
      
      // Fix for R2/Custom endpoints which might need this
      if (settings.provider === 'r2' || settings.provider === 'gcs') {
          clientConfig.forcePathStyle = true; 
      }

      const client = new S3Client(clientConfig);

      // Upload
      const command = new PutObjectCommand({
        Bucket: settings.bucket,
        Key: filename,
        Body: bytes,
        ContentType: mimeType,
        // ACL: 'public-read' // Note: R2/S3 often block ACLs by default now. We rely on bucket policy.
      });

      await client.send(command);

      // Construct Public URL
      if (settings.publicUrlBase) {
        // Remove trailing slash
        const base = settings.publicUrlBase.replace(/\/$/, "");
        return `${base}/${filename}`;
      } else {
        // Fallback standard S3/R2 URL construction
        if (settings.provider === 'r2' && settings.endpoint) {
            // R2 Public URL often involves a custom domain, but if using raw endpoint:
            // This is tricky without a public domain. Assuming user provided publicUrlBase for R2.
            return `${settings.endpoint}/${settings.bucket}/${filename}`;
        }
        return `https://${settings.bucket}.s3.${settings.region}.amazonaws.com/${filename}`;
      }

    } catch (error) {
      console.error("Failed to upload to cloud storage", error);
      alert("Failed to upload to cloud storage. Falling back to local storage.");
      return base64Data; // Fallback
    }
  }
};
