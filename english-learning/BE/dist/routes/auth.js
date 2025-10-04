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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Email configuration
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // This should be an App Password, not your regular password
        }
    });
};
// Email template for password reset
const createResetEmailTemplate = (resetLink, userName) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset - English Learning App</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #16a085; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .button:hover { background: #138d75; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 English Learning App</h1>
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <p>Hello${userName ? ` ${userName}` : ''},</p>
                <p>We received a request to reset your password for your English Learning App account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" class="button">Reset My Password</a>
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                <hr>
                <p><strong>Security Note:</strong> If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
            </div>
            <div class="footer">
                <p>This email was sent from English Learning App</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
const regSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(7),
    name: zod_1.z.string().min(1).optional()
});
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = regSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    const { email, password, name } = parsed.data;
    const exists = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists)
        return res.status(409).json({ error: 'Email already in use' });
    const hash = yield bcryptjs_1.default.hash(password, 10);
    const user = yield prisma_1.prisma.user.create({ data: { email, password: hash, name } });
    const token = jsonwebtoken_1.default.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(7)
});
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Invalid data' });
    const { email, password } = parsed.data;
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ error: 'Invalid email or password' });
    const ok = yield bcryptjs_1.default.compare(password, user.password);
    if (!ok)
        return res.status(401).json({ error: 'Invalid email or password' });
    const token = jsonwebtoken_1.default.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));
router.get('/me', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, email: true, name: true, role: true }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Forgot Password Schema
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
// Reset Password Schema
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string(),
    password: zod_1.z.string().min(7)
});
// Forgot Password Route
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid email format' });
        const { email } = parsed.data;
        // Check if user exists
        const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if email exists or not for security
            return res.json({ message: 'If the email exists, a password reset link has been sent.' });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        // Save reset token to database
        yield prisma_1.prisma.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry }
        });
        // Create reset link
        const resetLink = `http://localhost:3001/reset-password.html?token=${resetToken}`;
        // Send email if email credentials are configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = createTransporter();
                const mailOptions = {
                    from: `"English Learning App" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Password Reset Request - English Learning App',
                    html: createResetEmailTemplate(resetLink, user.name || undefined)
                };
                yield transporter.sendMail(mailOptions);
                console.log(`Password reset email sent to: ${email}`);
                res.json({
                    message: 'If the email exists, a password reset link has been sent to your email address.',
                    emailSent: true
                });
            }
            catch (emailError) {
                console.error('Email sending error:', emailError);
                // Fallback: return the reset link for development
                res.json({
                    message: 'Password reset link generated, but email could not be sent. Please use the link below.',
                    resetLink,
                    emailError: 'Email service unavailable'
                });
            }
        }
        else {
            // No email configuration - return reset link for development
            console.log(`Password reset token for ${email}: ${resetToken}`);
            console.log(`Reset link: ${resetLink}`);
            res.json({
                message: 'Password reset link generated. Email service not configured.',
                resetLink,
                resetToken,
                note: 'Configure EMAIL_USER and EMAIL_PASS environment variables to enable email sending'
            });
        }
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Reset Password Route
router.post('/reset-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ error: 'Invalid data' });
        const { token, password } = parsed.data;
        // Find user with valid reset token
        const user = yield prisma_1.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date() // Token must not be expired
                }
            }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        // Hash new password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Update user password and clear reset token
        yield prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        res.json({ message: 'Password has been reset successfully' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Free Dictionary API routes
const FREE_DICT_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
// Get word definition from Free Dictionary API
router.get('/dictionary/:word', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        const { word } = req.params;
        console.log(`Fetching Free Dictionary definition for word: ${word}`);
        const response = yield axios_1.default.get(`${FREE_DICT_BASE_URL}/${word.toLowerCase()}`);
        if (response.data && response.data.length > 0) {
            const entry = response.data[0];
            // Extract definition, pronunciation, and part of speech
            const definition = ((_d = (_c = (_b = (_a = entry.meanings) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.definitions) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.definition) || 'No definition available';
            const partOfSpeech = ((_f = (_e = entry.meanings) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.partOfSpeech) || '';
            const phonetic = entry.phonetic || ((_h = (_g = entry.phonetics) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.text) || '';
            // Extract synonyms from all meanings
            const synonyms = ((_j = entry.meanings) === null || _j === void 0 ? void 0 : _j.flatMap((meaning) => { var _a; return ((_a = meaning.definitions) === null || _a === void 0 ? void 0 : _a.flatMap((def) => def.synonyms || [])) || []; }).slice(0, 5)) || [];
            res.json({
                word: word,
                definition,
                partOfSpeech,
                pronunciation: phonetic,
                synonyms: synonyms.join(', '),
                source: 'Free Dictionary API'
            });
        }
        else {
            res.status(404).json({ error: 'Word not found in dictionary' });
        }
    }
    catch (error) {
        console.error('Free Dictionary API error:', ((_k = error.response) === null || _k === void 0 ? void 0 : _k.data) || error.message);
        res.status(500).json({
            error: 'Failed to fetch word definition',
            details: ((_m = (_l = error.response) === null || _l === void 0 ? void 0 : _l.data) === null || _m === void 0 ? void 0 : _m.title) || error.message
        });
    }
}));
// Test dictionary API endpoint
router.get('/dictionary/test', (req, res) => {
    res.json({
        message: 'Free Dictionary API endpoint is working',
        baseUrl: FREE_DICT_BASE_URL
    });
});
// Reset authentication data endpoint (for testing/admin purposes)
router.post('/reset-auth', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if user is admin
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true }
        });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        // Clear all password reset tokens
        yield prisma_1.prisma.user.updateMany({
            data: {
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        res.json({
            message: 'Authentication data reset successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Reset auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
