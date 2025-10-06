import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import axios from 'axios';
import type { AuthReq } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Free Dictionary API integration
const FREE_DICT_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Auto-fetch dictionary data for a word
const fetchDictionaryData = async (word: string) => {
  try {
    console.log(`Fetching dictionary data for word: ${word}`);
    
    const response = await axios.get(`${FREE_DICT_BASE_URL}/${word.toLowerCase()}`);
    
    if (response.data && response.data.length > 0) {
      const entry = response.data[0];
      
      // Extract definition, pronunciation, and part of speech
      const definition = entry.meanings?.[0]?.definitions?.[0]?.definition || '';
      const partOfSpeech = entry.meanings?.[0]?.partOfSpeech || '';
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
      
      // Extract synonyms from all meanings
      const synonyms = entry.meanings?.flatMap((meaning: any) => 
        meaning.definitions?.flatMap((def: any) => def.synonyms || []) || []
      ).slice(0, 5) || [];
      
      // Extract example from first definition
      const example = entry.meanings?.[0]?.definitions?.[0]?.example || '';
      
      return {
        definition,
        partOfSpeech,
        pronunciation: phonetic,
        synonyms: synonyms.join(', '),
        example: example,
        source: 'Free Dictionary API'
      };
    }
    return null;
  } catch (error: any) {
    console.error(`Failed to fetch dictionary data for "${word}":`, error.response?.data || error.message);
    return null;
  }
};

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

    // Auto-fetch dictionary data if definition is empty or just the word itself
    let finalDefinition = definition;
    let finalExample = example;
    let finalPronunciation = pronunciation;
    let finalPartOfSpeech = partOfSpeech;
    let finalSynonyms = synonyms;

    if (!definition || definition === word || definition.trim() === '') {
      console.log(`Auto-fetching dictionary data for word: ${word}`);
      const dictionaryData = await fetchDictionaryData(word);
      
      if (dictionaryData) {
        finalDefinition = dictionaryData.definition || word;
        finalExample = example || dictionaryData.example || '';
        finalPronunciation = dictionaryData.pronunciation || '';
        finalPartOfSpeech = dictionaryData.partOfSpeech || '';
        finalSynonyms = dictionaryData.synonyms || '';
        
        console.log(`Auto-fetched data for "${word}":`, {
          definition: finalDefinition,
          example: finalExample,
          pronunciation: finalPronunciation,
          partOfSpeech: finalPartOfSpeech,
          synonyms: finalSynonyms
        });
      } else {
        console.log(`No dictionary data found for "${word}", using fallback`);
        finalDefinition = word; // Fallback to word itself
      }
    }

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
          definition: finalDefinition, 
          example: finalExample, 
          difficulty,
          pronunciation: finalPronunciation || existing.pronunciation,
          partOfSpeech: finalPartOfSpeech || existing.partOfSpeech,
          synonyms: finalSynonyms ? finalSynonyms.split(',').map(s => s.trim()) : (existing.synonyms || [])
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
          definition: finalDefinition, 
          example: finalExample, 
          difficulty,
          pronunciation: finalPronunciation || '',
          partOfSpeech: finalPartOfSpeech || '',
          synonyms: finalSynonyms ? finalSynonyms.split(',').map(s => s.trim()) : []
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
