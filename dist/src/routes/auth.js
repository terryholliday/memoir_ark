"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = exports.authRoutes = void 0;
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
exports.authRoutes = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Simple JWT-like token using HMAC (for single-user local app)
const JWT_SECRET = process.env.JWT_SECRET || 'origins-dev-secret-change-in-production';
// Token utilities
function createToken(payload) {
    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const data = JSON.stringify({ ...payload, exp });
    const signature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    return Buffer.from(data).toString('base64url') + '.' + signature;
}
function verifyToken(token) {
    try {
        const [dataB64, signature] = token.split('.');
        if (!dataB64 || !signature)
            return null;
        const data = Buffer.from(dataB64, 'base64url').toString();
        const expectedSig = crypto_1.default.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
        if (signature !== expectedSig)
            return null;
        const payload = JSON.parse(data);
        if (payload.exp < Date.now())
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
// Google OAuth2 client for authentication (separate from Drive)
const getAuthOAuth2Client = () => {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
    if (!clientId || !clientSecret) {
        return null;
    }
    return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
};
// GET /api/auth/google - Start Google OAuth flow for login
exports.authRoutes.get('/google', (req, res) => {
    const oauth2Client = getAuthOAuth2Client();
    if (!oauth2Client) {
        return res.status(500).json({
            error: 'Google OAuth not configured',
            setup: 'Add GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET to .env'
        });
    }
    // Minimal scopes for authentication only
    const scopes = [
        'openid',
        'email',
        'profile',
    ];
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'select_account', // Allow user to choose account
    });
    res.json({ authUrl });
});
// GET /api/auth/google/callback - OAuth callback for login
exports.authRoutes.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
        return res.redirect('http://localhost:5173/login?error=missing_code');
    }
    const oauth2Client = getAuthOAuth2Client();
    if (!oauth2Client) {
        return res.redirect('http://localhost:5173/login?error=not_configured');
    }
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Get user info from Google
        const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();
        if (!userInfo.email || !userInfo.id) {
            return res.redirect('http://localhost:5173/login?error=no_email');
        }
        // Find or create user
        let user = await prisma.user.findUnique({
            where: { googleId: userInfo.id }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    googleId: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name || null,
                    picture: userInfo.picture || null,
                }
            });
        }
        else {
            // Update user info on each login
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    email: userInfo.email,
                    name: userInfo.name || user.name,
                    picture: userInfo.picture || user.picture,
                }
            });
        }
        // Create session token
        const token = createToken({ userId: user.id, email: user.email });
        // Redirect with token (frontend will store it)
        res.redirect(`http://localhost:5173/login/callback?token=${token}`);
    }
    catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect('http://localhost:5173/login?error=oauth_failed');
    }
});
// GET /api/auth/me - Get current user
exports.authRoutes.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, name: true, picture: true, createdAt: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
// POST /api/auth/logout - Logout (client-side token removal, but we can track it)
exports.authRoutes.post('/logout', (req, res) => {
    // For a simple implementation, logout is handled client-side by removing the token
    // In production, you might want to maintain a token blacklist
    res.json({ success: true });
});
// ============================================
// EMAIL/PASSWORD AUTHENTICATION
// ============================================
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Hash password using PBKDF2
function hashPassword(password) {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const verifyHash = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}
// POST /api/auth/signup - Email/password signup
exports.authRoutes.post('/signup', async (req, res) => {
    try {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.errors
            });
        }
        const { email, password, name } = parsed.data;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        // Create user with hashed password
        const passwordHash = hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: name || null,
            }
        });
        // Create session token
        const token = createToken({ userId: user.id, email: user.email });
        res.status(201).json({
            user: { id: user.id, email: user.email, name: user.name },
            token,
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});
// POST /api/auth/login - Email/password login
exports.authRoutes.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: parsed.error.errors
            });
        }
        const { email, password } = parsed.data;
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Verify password
        if (!verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Create session token
        const token = createToken({ userId: user.id, email: user.email });
        res.json({
            user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = { userId: payload.userId, email: payload.email };
    next();
};
exports.requireAuth = requireAuth;
// Optional auth - doesn't fail if no token, just doesn't set user
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const payload = verifyToken(token);
        if (payload) {
            req.user = { userId: payload.userId, email: payload.email };
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map