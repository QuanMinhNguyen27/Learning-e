"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    try {
        const hdr = req.headers.authorization || '';
        const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: 'Unauthorized' });
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = parseInt(payload.sub);
        return next();
    }
    catch (_a) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
