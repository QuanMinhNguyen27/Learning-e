import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import type { AuthReq } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET current user's vocabulary
router.get('/', requireAuth, async (req: AuthReq, res) => {
  const list = await prisma.vocabulary.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

// Add new vocab (or upsert)
const addSchema = z.object({
  word: z.string().min(1),
  definition: z.string().default(''),
  example: z.string().default(''),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  pronunciation: z.string().optional(),
  partOfSpeech: z.string().optional(),
  synonyms: z.string().optional()
});

router.post('/', requireAuth, async (req: AuthReq, res) => {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' });
  const { word, definition, example, difficulty, pronunciation, partOfSpeech, synonyms } = parsed.data;

  try {
    console.log(`Saving vocabulary word to database:`, {
      userId: req.userId,
      word,
      definition,
      pronunciation,
      partOfSpeech,
      synonyms
    });

    // Check if word already exists for this user
    const existing = await prisma.vocabulary.findFirst({
      where: { userId: req.userId!, word }
    });
    
    if (existing) {
      // Update existing word
      console.log(`Updating existing word "${word}" for user ${req.userId}`);
      const item = await prisma.vocabulary.update({
        where: { id: existing.id },
        data: { 
          definition, 
          example, 
          difficulty,
          pronunciation: pronunciation || existing.pronunciation,
          partOfSpeech: partOfSpeech || existing.partOfSpeech,
          synonyms: synonyms ? synonyms.split(',').map(s => s.trim()) : (existing.synonyms || [])
        }
      });
      console.log(`Successfully updated word "${word}" in database`);
      res.json(item);
    } else {
      // Create new word
      console.log(`Creating new word "${word}" for user ${req.userId}`);
      const item = await prisma.vocabulary.create({
        data: { 
          userId: req.userId!, 
          word, 
          definition, 
          example, 
          difficulty,
          pronunciation: pronunciation || '',
          partOfSpeech: partOfSpeech || '',
          synonyms: synonyms ? synonyms.split(',').map(s => s.trim()) : []
        }
      });
      console.log(`Successfully created word "${word}" in database`);
      res.json(item);
    }
  } catch (e) {
    console.error('Database error saving vocabulary:', e);
    res.status(500).json({ error: 'Failed to save vocabulary' });
  }
});

// Update vocab
router.put('/:id', requireAuth, async (req: AuthReq, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
  
  const parsed = addSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' });

  // Ensure ownership
  const found = await prisma.vocabulary.findUnique({ where: { id } });
  if (!found || found.userId !== req.userId) return res.status(404).json({ error: 'Not found' });

  const updateData: any = { ...parsed.data };
  if (updateData.synonyms && typeof updateData.synonyms === 'string') {
    updateData.synonyms = updateData.synonyms.split(',').map((s: string) => s.trim());
  }
  const updated = await prisma.vocabulary.update({ where: { id }, data: updateData });
  res.json(updated);
});

// Delete vocab
router.delete('/:id', requireAuth, async (req: AuthReq, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
  
  const found = await prisma.vocabulary.findUnique({ where: { id } });
  if (!found || found.userId !== req.userId) return res.status(404).json({ error: 'Not found' });
  await prisma.vocabulary.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
