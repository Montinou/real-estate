/**
 * API Route: Serve images from R2 using credentials
 * /api/images/properties/123/0-abc.jpg
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get path from URL: /api/images/properties/123/0-abc.jpg -> properties/123/0-abc.jpg
    const { path } = req.query;
    const filePath = Array.isArray(path) ? path.join('/') : path;

    // Fetch from R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filePath,
    });

    const response = await r2Client.send(command);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Set cache headers
    res.setHeader('Content-Type', response.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Length', buffer.length);

    // Send image
    res.status(200).send(buffer);

  } catch (error) {
    console.error('R2 image fetch error:', error);

    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.status(500).json({
      error: 'Failed to fetch image',
      details: error.message
    });
  }
}
