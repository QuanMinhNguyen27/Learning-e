import { Router } from 'express';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import axios from 'axios';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import type { AuthReq } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // This should be an App Password, not your regular password
    }
  });
};

// Email template for password reset
const createResetEmailTemplate = (resetLink: string, userName?: string) => {
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

const regSchema = z.object({
  email: z.string().email(),
  password: z.string().min(7),
  name: z.string().min(1).optional()
});

router.post('/register', async (req, res) => {
  const parsed = regSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' });

  const { email, password, name } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, name } });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(7)
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid data' });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.get('/me', requireAuth, async (req: AuthReq, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password Schema
const forgotPasswordSchema = z.object({
  email: z.string().email()
});

// Reset Password Schema
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(7)
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid email format' });

    const { email } = parsed.data;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
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

        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to: ${email}`);
        
        res.json({ 
          message: 'If the email exists, a password reset link has been sent to your email address.',
          emailSent: true
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        
        // Fallback: return the reset link for development
        res.json({ 
          message: 'Password reset link generated, but email could not be sent. Please use the link below.',
          resetLink,
          emailError: 'Email service unavailable'
        });
      }
    } else {
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
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid data' });

    const { token, password } = parsed.data;

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Free Dictionary API routes
const FREE_DICT_BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

// Get word definition from Free Dictionary API
router.get('/dictionary/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    console.log(`Fetching Free Dictionary definition for word: ${word}`);
    
    const response = await axios.get(`${FREE_DICT_BASE_URL}/${word.toLowerCase()}`);
    
    if (response.data && response.data.length > 0) {
      const entry = response.data[0];
      
      // Extract definition, pronunciation, and part of speech
      const definition = entry.meanings?.[0]?.definitions?.[0]?.definition || 'No definition available';
      const partOfSpeech = entry.meanings?.[0]?.partOfSpeech || '';
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || '';
      
      // Extract synonyms from all meanings
      const synonyms = entry.meanings?.flatMap((meaning: any) => 
        meaning.definitions?.flatMap((def: any) => def.synonyms || []) || []
      ).slice(0, 5) || [];
      
      res.json({
        word: word,
        definition,
        partOfSpeech,
        pronunciation: phonetic,
        synonyms: synonyms.join(', '),
        source: 'Free Dictionary API'
      });
    } else {
      res.status(404).json({ error: 'Word not found in dictionary' });
    }
  } catch (error: any) {
    console.error('Free Dictionary API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch word definition',
      details: error.response?.data?.title || error.message 
    });
  }
});

// Test dictionary API endpoint
router.get('/dictionary/test', (req, res) => {
  res.json({ 
    message: 'Free Dictionary API endpoint is working',
    baseUrl: FREE_DICT_BASE_URL
  });
});

// Reset authentication data endpoint (for testing/admin purposes)
router.post('/reset-auth', requireAuth, async (req: AuthReq, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Clear all password reset tokens
    await prisma.user.updateMany({
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({ 
      message: 'Authentication data reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
