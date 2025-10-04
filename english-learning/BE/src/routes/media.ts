import { Router } from 'express';
import { prisma } from '../prisma';
import type { AuthReq } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get all active media content for users
router.get('/content', requireAuth, async (req: AuthReq, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type as string;
    const difficulty = req.query.difficulty as string;
    const category = req.query.category as string;
    
    // Build where clause
    const where: any = {
      isActive: true
    };
    
    if (type) {
      where.type = type;
    }
    
    if (difficulty) {
      where.difficulty = difficulty;
    }
    
    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive'
      };
    }
    
    const [mediaContent, total] = await Promise.all([
      prisma.mediaContent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          filePath: true,
          thumbnailPath: true,
          duration: true,
          difficulty: true,
          category: true,
          tags: true,
          createdAt: true
        }
      }),
      prisma.mediaContent.count({ where })
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
    console.error('Get media content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single media content with lyrics
router.get('/content/:id', requireAuth, async (req: AuthReq, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const mediaContent = await prisma.mediaContent.findFirst({
      where: { 
        id,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        filePath: true,
        thumbnailPath: true,
        duration: true,
        difficulty: true,
        category: true,
        tags: true,
        lyrics: true,
        createdAt: true
      }
    });
    
    if (!mediaContent) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    res.json(mediaContent);
    
  } catch (error) {
    console.error('Get media content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content categories
router.get('/categories', requireAuth, async (req: AuthReq, res) => {
  try {
    const categories = await prisma.mediaContent.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    });
    
    const categoryList = categories
      .map(c => c.category)
      .filter(c => c && c.trim().length > 0)
      .sort();
    
    res.json({ categories: categoryList });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
