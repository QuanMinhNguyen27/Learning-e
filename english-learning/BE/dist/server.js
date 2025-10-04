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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const vocab_1 = __importDefault(require("./routes/vocab"));
const admin_1 = __importDefault(require("./routes/admin"));
const media_1 = __importDefault(require("./routes/media"));
const prisma_1 = require("./prisma");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT || 5000);
app.use((0, cors_1.default)({
    origin: (_b = (_a = process.env.CORS_ORIGIN) === null || _a === void 0 ? void 0 : _a.split(',')) !== null && _b !== void 0 ? _b : ['http://localhost:3000'],
    credentials: false
}));
app.use(express_1.default.json());
// Serve uploaded files
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', auth_1.default);
app.use('/api/vocab', vocab_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/media', media_1.default);
// Authentication reset functionality
const resetAuthenticationData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄 Resetting authentication data...');
        // Clear all password reset tokens
        yield prisma_1.prisma.user.updateMany({
            data: {
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        console.log('✅ Password reset tokens cleared');
        console.log('✅ Authentication data reset completed');
    }
    catch (error) {
        console.error('❌ Error resetting authentication data:', error);
    }
});
// Graceful shutdown handler
const gracefulShutdown = (signal) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    try {
        // Reset authentication data
        yield resetAuthenticationData();
        // Close database connection
        yield prisma_1.prisma.$disconnect();
        console.log('✅ Database connection closed');
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
});
// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
// Handle uncaught exceptions
process.on('uncaughtException', (error) => __awaiter(void 0, void 0, void 0, function* () {
    console.error('❌ Uncaught Exception:', error);
    yield resetAuthenticationData();
    process.exit(1);
}));
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => __awaiter(void 0, void 0, void 0, function* () {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    yield resetAuthenticationData();
    process.exit(1);
}));
const server = app.listen(PORT, () => {
    console.log(`🚀 API listening on http://localhost:${PORT}`);
    console.log('📝 Authentication reset will occur on server shutdown');
});
// Export server for testing
exports.default = server;
