import { Router } from 'express';
import { prisma } from '../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import type { AuthReq } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, file.fieldname);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow video and audio files
  const allowedMimes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mpeg',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video, audio, and image files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Middleware to check if user is admin
const requireAdmin = async (req: AuthReq, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Schema for media content validation
const mediaContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['VIDEO', 'AUDIO', 'MUSIC_VIDEO']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  lyrics: z.string().optional(),
  isActive: z.boolean().optional()
});

// Upload media content
router.post('/upload-media', requireAuth, requireAdmin, upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req: AuthReq, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const body = req.body;
    
    // Validate required fields
    const parsed = mediaContentSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
    }
    
    const { title, description, type, difficulty, category, tags, lyrics } = parsed.data;
    
    // Check if media file was uploaded
    if (!files.mediaFile || files.mediaFile.length === 0) {
      return res.status(400).json({ error: 'Media file is required' });
    }
    
    const mediaFile = files.mediaFile[0];
    const thumbnailFile = files.thumbnail ? files.thumbnail[0] : null;
    
    // Process tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    
    // Create media content record
    const mediaContent = await prisma.mediaContent.create({
      data: {
        title,
        description,
        type: type as any,
        filePath: `/uploads/${mediaFile.fieldname}/${mediaFile.filename}`,
        thumbnailPath: thumbnailFile ? `/uploads/${thumbnailFile.fieldname}/${thumbnailFile.filename}` : null,
        difficulty: difficulty as any || 'BEGINNER',
        category,
        tags: tagsArray,
        lyrics,
        uploaderId: req.userId,
        isActive: true
      }
    });
    
    res.json({
      message: 'Media content uploaded successfully',
      mediaContent: {
        id: mediaContent.id,
        title: mediaContent.title,
        type: mediaContent.type,
        filePath: mediaContent.filePath,
        thumbnailPath: mediaContent.thumbnailPath
      }
    });
    
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all media content
router.get('/media', requireAuth, requireAdmin, async (req: AuthReq, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const [mediaContent, total] = await Promise.all([
      prisma.mediaContent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.mediaContent.count()
    ]);
    
    res.json({
      mediaContent,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single media content
router.get('/media/:id', requireAuth, requireAdmin, async (req: AuthReq, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const mediaContent = await prisma.mediaContent.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    if (!mediaContent) {
      return res.status(404).json({ error: 'Media content not found' });
    }
    
    res.json(mediaContent);
    
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update media content
router.put('/media/:id', requireAuth, requireAdmin, async (req: AuthReq, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    
    const parsed = mediaContentSchema.partial().safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
    }
    
    const updateData = parsed.data;
    
    // Process tags if provided
    let processedData: any = { ...updateData };
    if (updateData.tags) {
      const tagsArray = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      processedData.tags = tagsArray;
    }
    
    const mediaContent = await prisma.mediaContent.update({
      where: { id },
      data: processedData
    });
    
    res.json({
      message: 'Media content updated successfully',
      mediaContent
    });
    
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete media content
router.delete('/media/:id', requireAuth, requireAdmin, async (req: AuthReq, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const mediaContent = await prisma.mediaContent.findUnique({
      where: { id }
    });
    
    if (!mediaContent) {
      return res.status(404).json({ error: 'Media content not found' });
    }
    
    // Delete files from filesystem
    const mediaFilePath = path.join(__dirname, '../../', mediaContent.filePath);
    if (fs.existsSync(mediaFilePath)) {
      fs.unlinkSync(mediaFilePath);
    }
    
    if (mediaContent.thumbnailPath) {
      const thumbnailFilePath = path.join(__dirname, '../../', mediaContent.thumbnailPath);
      if (fs.existsSync(thumbnailFilePath)) {
        fs.unlinkSync(thumbnailFilePath);
      }
    }
    
    // Delete from database
    await prisma.mediaContent.delete({
      where: { id }
    });
    
    res.json({ message: 'Media content deleted successfully' });
    
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle media content active status
router.patch('/media/:id/toggle', requireAuth, requireAdmin, async (req: AuthReq, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const mediaContent = await prisma.mediaContent.findUnique({
      where: { id }
    });
    
    if (!mediaContent) {
      return res.status(404).json({ error: 'Media content not found' });
    }
    
    const updatedMedia = await prisma.mediaContent.update({
      where: { id },
      data: { isActive: !mediaContent.isActive }
    });
    
    res.json({
      message: `Media content ${updatedMedia.isActive ? 'activated' : 'deactivated'} successfully`,
      mediaContent: updatedMedia
    });
    
  } catch (error) {
    console.error('Toggle media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update media files (replace video/audio files)
router.put('/media/:id/files', requireAuth, requireAdmin, upload.fields([
  { name: 'mediaFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req: AuthReq, res) => {
  try {
    const id = parseInt(req.params.id);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const mediaContent = await prisma.mediaContent.findUnique({
      where: { id }
    });
    
    if (!mediaContent) {
      return res.status(404).json({ error: 'Media content not found' });
    }
    
    const updateData: any = {};
    
    // Handle media file replacement
    if (files.mediaFile && files.mediaFile.length > 0) {
      const mediaFile = files.mediaFile[0];
      
      // Delete old media file
      const oldMediaPath = path.join(__dirname, '../../', mediaContent.filePath);
      if (fs.existsSync(oldMediaPath)) {
        fs.unlinkSync(oldMediaPath);
      }
      
      // Update with new file path
      updateData.filePath = `/uploads/${mediaFile.fieldname}/${mediaFile.filename}`;
    }
    
    // Handle thumbnail replacement
    if (files.thumbnail && files.thumbnail.length > 0) {
      const thumbnailFile = files.thumbnail[0];
      
      // Delete old thumbnail if exists
      if (mediaContent.thumbnailPath) {
        const oldThumbnailPath = path.join(__dirname, '../../', mediaContent.thumbnailPath);
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
        }
      }
      
      // Update with new thumbnail path
      updateData.thumbnailPath = `/uploads/${thumbnailFile.fieldname}/${thumbnailFile.filename}`;
    }
    
    // Update database
    const updatedMedia = await prisma.mediaContent.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      message: 'Media files updated successfully',
      mediaContent: updatedMedia
    });
    
  } catch (error) {
    console.error('Update media files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
