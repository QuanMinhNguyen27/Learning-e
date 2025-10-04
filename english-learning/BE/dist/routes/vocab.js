"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET current user's vocabulary
router.get('/', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const list = yield prisma_1.prisma.vocabulary.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' }
    });
    res.json(list);
}));
// Add new vocab (or upsert)
const addSchema = zod_1.z.object({
    word: zod_1.z.string().min(1),
    definition: zod_1.z.string().default(''),
    example: zod_1.z.string().default(''),
    difficulty: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER')
});
router.post('/', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    const { word, definition, example, difficulty } = parsed.data;
    try {
        // Check if word already exists for this user
        const existing = yield prisma_1.prisma.vocabulary.findFirst({
            where: { userId: req.userId, word }
        });
        if (existing) {
            // Update existing word
            const item = yield prisma_1.prisma.vocabulary.update({
                where: { id: existing.id },
                data: { definition, example, difficulty }
            });
            res.json(item);
        }
        else {
            // Create new word
            const item = yield prisma_1.prisma.vocabulary.create({
                data: { userId: req.userId, word, definition, example, difficulty }
            });
            res.json(item);
        }
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to save vocabulary' });
    }
}));
// Update vocab
router.put('/:id', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    if (isNaN(id))
        return res.status(400).json({ error: 'Invalid ID' });
    const parsed = addSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    // Ensure ownership
    const found = yield prisma_1.prisma.vocabulary.findUnique({ where: { id } });
    if (!found || found.userId !== req.userId)
        return res.status(404).json({ error: 'Not found' });
    const updated = yield prisma_1.prisma.vocabulary.update({ where: { id }, data: parsed.data });
    res.json(updated);
}));
// Delete vocab
router.delete('/:id', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id);
    if (isNaN(id))
        return res.status(400).json({ error: 'Invalid ID' });
    const found = yield prisma_1.prisma.vocabulary.findUnique({ where: { id } });
    if (!found || found.userId !== req.userId)
        return res.status(404).json({ error: 'Not found' });
    yield prisma_1.prisma.vocabulary.delete({ where: { id } });
    res.json({ ok: true });
}));
exports.default = router;
