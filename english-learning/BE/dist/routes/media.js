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
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all active media content for users
router.get('/content', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const type = req.query.type;
        const difficulty = req.query.difficulty;
        const category = req.query.category;
        // Build where clause
        const where = {
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
        const [mediaContent, total] = yield Promise.all([
            prisma_1.prisma.mediaContent.findMany({
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
            prisma_1.prisma.mediaContent.count({ where })
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
    }
    catch (error) {
        console.error('Get media content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get single media content with lyrics
router.get('/content/:id', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const mediaContent = yield prisma_1.prisma.mediaContent.findFirst({
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
    }
    catch (error) {
        console.error('Get media content error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get content categories
router.get('/categories', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma_1.prisma.mediaContent.findMany({
            where: { isActive: true },
            select: { category: true },
            distinct: ['category']
        });
        const categoryList = categories
            .map(c => c.category)
            .filter(c => c && c.trim().length > 0)
            .sort();
        res.json({ categories: categoryList });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
