import { z } from 'zod';

export const imageUploadResponseSchema = z.object({
  evidence_id: z.string(),
  image_analysis_id: z.string(),
  entity_id: z.string(),
  sha256: z.string(),
  sha512: z.string(),
  phash: z.string(),
  dhash: z.string(),
  ahash: z.string(),
  width: z.number(),
  height: z.number(),
  mime_type: z.string(),
  file_size: z.number(),
  exif: z.object({
    camera_make: z.string().optional(),
    camera_model: z.string().optional(),
    lens: z.string().optional(),
    software: z.string().optional(),
    capture_timestamp: z.string().optional(),
    gps_latitude: z.number().optional(),
    gps_longitude: z.number().optional(),
    gps_altitude: z.number().optional(),
  }).optional(),
});

export type ImageUploadResponse = z.infer<typeof imageUploadResponseSchema>;
