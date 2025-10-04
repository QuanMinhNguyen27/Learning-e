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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(uploadsDir, file.fieldname);
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
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
    }
    else {
        cb(new Error('Invalid file type. Only video, audio, and image files are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});
// Middleware to check if user is admin
const requireAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true }
        });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Schema for media content validation
const mediaContentSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['VIDEO', 'AUDIO', 'MUSIC_VIDEO']),
    difficulty: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.string().optional(), // Comma-separated tags
    lyrics: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional()
});
// Upload media content
router.post('/upload-media', auth_1.requireAuth, requireAdmin, upload.fields([
    { name: 'mediaFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
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
        const mediaContent = yield prisma_1.prisma.mediaContent.create({
            data: {
                title,
                description,
                type: type,
                filePath: `/uploads/${mediaFile.fieldname}/${mediaFile.filename}`,
                thumbnailPath: thumbnailFile ? `/uploads/${thumbnailFile.fieldname}/${thumbnailFile.filename}` : null,
                difficulty: difficulty || 'BEGINNER',
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
    }
    catch (error) {
        console.error('Upload media error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get all media content
router.get('/media', auth_1.requireAuth, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const [mediaContent, total] = yield Promise.all([
            prisma_1.prisma.mediaContent.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    uploader: {
                        select: { id: true, name: true, email: true }
                    }
                }
            }),
            prisma_1.prisma.mediaContent.count()
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
        console.error('Get media error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get single media content
router.get('/media/:id', auth_1.requireAuth, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const mediaContent = yield prisma_1.prisma.mediaContent.findUnique({
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
    }
    catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update media content
router.put('/media/:id', auth_1.requireAuth, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;
        const parsed = mediaContentSchema.partial().safeParse(body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid data', details: parsed.error.errors });
        }
        const updateData = parsed.data;
        // Process tags if provided
        let processedData = Object.assign({}, updateData);
        if (updateData.tags) {
            const tagsArray = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            processedData.tags = tagsArray;
        }
        const mediaContent = yield prisma_1.prisma.mediaContent.update({
            where: { id },
            data: processedData
        });
        res.json({
            message: 'Media content updated successfully',
            mediaContent
        });
    }
    catch (error) {
        console.error('Update media error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Delete media content
router.delete('/media/:id', auth_1.requireAuth, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const mediaContent = yield prisma_1.prisma.mediaContent.findUnique({
            where: { id }
        });
        if (!mediaContent) {
            return res.status(404).json({ error: 'Media content not found' });
        }
        // Delete files from filesystem
        const mediaFilePath = path_1.default.join(__dirname, '../../', mediaContent.filePath);
        if (fs_1.default.existsSync(mediaFilePath)) {
            fs_1.default.unlinkSync(mediaFilePath);
        }
        if (mediaContent.thumbnailPath) {
            const thumbnailFilePath = path_1.default.join(__dirname, '../../', mediaContent.thumbnailPath);
            if (fs_1.default.existsSync(thumbnailFilePath)) {
                fs_1.default.unlinkSync(thumbnailFilePath);
            }
        }
        // Delete from database
        yield prisma_1.prisma.mediaContent.delete({
            where: { id }
        });
        res.json({ message: 'Media content deleted successfully' });
    }
    catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Toggle media content active status
router.patch('/media/:id/toggle', auth_1.requireAuth, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const mediaContent = yield prisma_1.prisma.mediaContent.findUnique({
            where: { id }
        });
        if (!mediaContent) {
            return res.status(404).json({ error: 'Media content not found' });
        }
        const updatedMedia = yield prisma_1.prisma.mediaContent.update({
            where: { id },
            data: { isActive: !mediaContent.isActive }
        });
        res.json({
            message: `Media content ${updatedMedia.isActive ? 'activated' : 'deactivated'} successfully`,
            mediaContent: updatedMedia
        });
    }
    catch (error) {
        console.error('Toggle media error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update media files (replace video/audio files)
router.put('/media/:id/files', auth_1.requireAuth, requireAdmin, upload.fields([
    { name: 'mediaFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        const files = req.files;
        const mediaContent = yield prisma_1.prisma.mediaContent.findUnique({
            where: { id }
        });
        if (!mediaContent) {
            return res.status(404).json({ error: 'Media content not found' });
        }
        const updateData = {};
        // Handle media file replacement
        if (files.mediaFile && files.mediaFile.length > 0) {
            const mediaFile = files.mediaFile[0];
            // Delete old media file
            const oldMediaPath = path_1.default.join(__dirname, '../../', mediaContent.filePath);
            if (fs_1.default.existsSync(oldMediaPath)) {
                fs_1.default.unlinkSync(oldMediaPath);
            }
            // Update with new file path
            updateData.filePath = `/uploads/${mediaFile.fieldname}/${mediaFile.filename}`;
        }
        // Handle thumbnail replacement
        if (files.thumbnail && files.thumbnail.length > 0) {
            const thumbnailFile = files.thumbnail[0];
            // Delete old thumbnail if exists
            if (mediaContent.thumbnailPath) {
                const oldThumbnailPath = path_1.default.join(__dirname, '../../', mediaContent.thumbnailPath);
                if (fs_1.default.existsSync(oldThumbnailPath)) {
                    fs_1.default.unlinkSync(oldThumbnailPath);
                }
            }
            // Update with new thumbnail path
            updateData.thumbnailPath = `/uploads/${thumbnailFile.fieldname}/${thumbnailFile.filename}`;
        }
        // Update database
        const updatedMedia = yield prisma_1.prisma.mediaContent.update({
            where: { id },
            data: updateData
        });
        res.json({
            message: 'Media files updated successfully',
            mediaContent: updatedMedia
        });
    }
    catch (error) {
        console.error('Update media files error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
