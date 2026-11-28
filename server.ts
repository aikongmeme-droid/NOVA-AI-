import 'dotenv/config';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { resolveNovaMode, STAR_PACKAGES } from './src/shared/billing';
import { NOVA_EMOTION_CATALOG } from './src/shared/emotions';
import { sanitizeUserMessage } from './src/shared/inputFilter';
import {
  applyUsageTick,
  clearUserHistoryAndMemory,
  getOrRefreshUserBalance,
  getPaymentOrder,
  getRecentMessages,
  getUserMemories,
  getUserSettings,
  updateUserSettings,
  userExistsInDb,
} from './server/db';
import {
  clampElapsedTickSeconds,
  isValidNewWebUserId,
  signSessionToken,
  timingSafeEqualStrings,
  verifySessionToken,
} from './server/auth';
import {
  attachLiveWebSocketServer,
  formatFriendlyAiError,
  runNovaChatTurn,
  synthesizeMessageSpeech,
} from './server/ai';
import {
  DEFAULT_PERSONALITY_TRAITS,
  normalizePersonalityArchetype,
} from './src/shared/personality';
import {
  createTelegramStarsInvoice,
  getTelegramBotConfig,
  processTelegramWebhookUpdate,
  verifyOrderViaTelegramApi,
  verifyTelegramWebAppInitData,
} from './server/payments';

function resolveListenPort(): number {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    } else if (arg.startsWith('--port=')) {
      const parsed = Number(arg.slice('--port='.length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }
  const defaultPort = Number(process.env.DEFAULT_APP_PORT);
  return Number.isFinite(defaultPort) && defaultPort > 0 ? defaultPort : 3000;
}

const PORT = resolveListenPort();
const IS_PROD = process.env.NODE_ENV === 'production';

function extractIncomingToken(req: express.Request): string | undefined {
  const headerToken = req.headers['x-nova-session'];
  if (typeof headerToken === 'string' && headerToken.trim()) {
    return headerToken.trim();
  }
  if (typeof req.body?.sessionToken === 'string' && req.body.sessionToken.trim()) {
    return req.body.sessionToken.trim();
  }
  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }
  return undefined;
}

function authenticateExistingRequest(req: express.Request): string | null {
  const tgInitData =
    typeof req.body?.tgInitData === 'string'
      ? req.body.tgInitData
      : typeof req.query?.tgInitData === 'string'
        ? req.query.tgInitData
        : '';

  if (tgInitData) {
    const verified = verifyTelegramWebAppInitData(tgInitData);
    if (verified.valid && verified.telegramUserId) {
      return verified.telegramUserId;
    }
  }

  const token = extractIncomingToken(req);
  const verifiedUserId = verifySessionToken(token);
  if (!verifiedUserId) {
    return null;
  }

  const requestedUserId =
    typeof req.body?.userId === 'string'
      ? req.body.userId.trim()
      : typeof req.query?.userId === 'string'
        ? req.query.userId.trim()
        : '';

  if (requestedUserId && requestedUserId !== verifiedUserId) {
    return null;
  }

  return verifiedUserId;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      videosCount: NOVA_EMOTION_CATALOG.length,
    });
  });

  app.post('/api/session', async (req, res) => {
    try {
      const { userId: rawUserId, tgInitData, tzOffsetMinutes = 0 } = req.body ?? {};
      let userId: string | null = null;

      if (typeof tgInitData === 'string' && tgInitData) {
        const verified = verifyTelegramWebAppInitData(tgInitData);
        if (verified.valid && verified.telegramUserId) {
          userId = verified.telegramUserId;
        }
      }

      if (!userId) {
        const tokenUserId = verifySessionToken(extractIncomingToken(req));
        const candidate = typeof rawUserId === 'string' ? rawUserId.trim() : '';

        if (tokenUserId && (!candidate || candidate === tokenUserId)) {
          userId = tokenUserId;
        } else if (isValidNewWebUserId(candidate) && !userExistsInDb(candidate)) {
          userId = candidate;
        } else {
          res.status(401).json({
            error: 'Unauthorized profile access. Valid session token or Telegram initData required.',
          });
          return;
        }
      }

      const sessionToken = signSessionToken(userId);
      const balance = getOrRefreshUserBalance(userId, Number(tzOffsetMinutes) || 0);
      const settings = getUserSettings(userId);
      const history = getRecentMessages(userId, 500);
      const memories = getUserMemories(userId, 100);
      const { configured: telegramBotConfigured, botUsername: telegramBotUsername } =
        getTelegramBotConfig();

      res.json({
        userId,
        sessionToken,
        mode: resolveNovaMode(balance),
        balance,
        settings,
        history,
        memories,
        starPackages: STAR_PACKAGES,
        telegramBotConfigured,
        telegramBotUsername,
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to initialize session',
      });
    }
  });

  app.post('/api/usage/tick', (req, res) => {
    try {
      const userId = authenticateExistingRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized session' });
        return;
      }
      const { elapsedSeconds = 5, tzOffsetMinutes = 0 } = req.body ?? {};
      const safeElapsed = clampElapsedTickSeconds(userId, Number(elapsedSeconds) || 0);
      const balance =
        safeElapsed > 0
          ? applyUsageTick(userId, safeElapsed, Number(tzOffsetMinutes) || 0)
          : getOrRefreshUserBalance(userId, Number(tzOffsetMinutes) || 0);
      res.json({ balance });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update usage timer',
      });
    }
  });

  app.post('/api/chat/turn', async (req, res) => {
    try {
      const userId = authenticateExistingRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized session' });
        return;
      }

      const {
        textInput,
        audioBase64,
        audioMimeType,
        hintLanguage,
        generateVoice = true,
        tzOffsetMinutes = 0,
        elapsedSeconds = 0,
      } = req.body ?? {};

      const tz = Number(tzOffsetMinutes) || 0;
      let balance = getOrRefreshUserBalance(userId, tz);

      const isTextOnlyTurn = typeof textInput === 'string' && !audioBase64;
      const isVoiceTurn = !isTextOnlyTurn;

      if (balance.totalSecondsRemaining <= 0 && isVoiceTurn) {
        res.status(402).json({
          code: 'TIME_EXHAUSTED',
          mode: 'TEXT_ONLY',
          error: 'Your free time is over. Continue talking with NOVA.',
          balance,
        });
        return;
      }

      if (typeof textInput === 'string' && !audioBase64) {
        const { valid, cleanText } = sanitizeUserMessage(textInput);
        if (!valid) {
          console.log('Слишком короткий звук проигнорирован');
          res.json({
            ignored: true,
            reason: 'SHORT_INPUT_IGNORED',
            mode: resolveNovaMode(balance),
            balance,
            history: getRecentMessages(userId, 50),
            memories: getUserMemories(userId, 25),
          });
          return;
        }
        req.body.textInput = cleanText;
      }

      if (isVoiceTurn && Number(elapsedSeconds) > 0 && balance.totalSecondsRemaining > 0) {
        const safeElapsed = clampElapsedTickSeconds(userId, Number(elapsedSeconds));
        if (safeElapsed > 0) {
          balance = applyUsageTick(userId, safeElapsed, tz);
        }
      }

      const effectiveGenerateVoice =
        balance.totalSecondsRemaining > 0 ? Boolean(generateVoice) : false;

      const result = await runNovaChatTurn({
        userId,
        textInput: req.body?.textInput,
        audioBase64,
        audioMimeType,
        hintLanguage: typeof hintLanguage === 'string' ? hintLanguage : undefined,
        generateVoice: effectiveGenerateVoice,
        tzOffsetMinutes: tz,
      });

      const history = getRecentMessages(userId, 500);
      const memories = getUserMemories(userId, 100);

      res.json({
        ...result,
        mode: resolveNovaMode(balance),
        balance,
        history,
        memories,
      });
    } catch (err) {
      console.error('Chat turn error:', err);
      res.status(500).json({
        error: formatFriendlyAiError(err),
      });
    }
  });

  app.get('/api/history', (req, res) => {
    const userId = authenticateExistingRequest(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized session' });
      return;
    }
    res.json({
      history: getRecentMessages(userId, 500),
      memories: getUserMemories(userId, 100),
      settings: getUserSettings(userId),
    });
  });

  app.delete('/api/history', (req, res) => {
    const userId = authenticateExistingRequest(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized session' });
      return;
    }
    clearUserHistoryAndMemory(userId);
    res.json({ ok: true, history: [], memories: [], lockedLanguage: null });
  });

  app.post('/api/settings', (req, res) => {
    const userId = authenticateExistingRequest(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized session' });
      return;
    }
    const {
      memoryEnabled,
      subtitlesEnabled,
      lockedLanguage,
      personalityArchetype,
      resetPersonalityTraits,
    } = req.body ?? {};
    const settings = updateUserSettings(userId, {
      memoryEnabled: typeof memoryEnabled === 'boolean' ? memoryEnabled : undefined,
      subtitlesEnabled: typeof subtitlesEnabled === 'boolean' ? subtitlesEnabled : undefined,
      lockedLanguage:
        lockedLanguage === null || typeof lockedLanguage === 'string'
          ? lockedLanguage
          : undefined,
      personalityArchetype:
        typeof personalityArchetype === 'string'
          ? normalizePersonalityArchetype(personalityArchetype)
          : undefined,
      personalityTraits:
        resetPersonalityTraits === true ? { ...DEFAULT_PERSONALITY_TRAITS } : undefined,
    });
    res.json({ settings });
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const userId = authenticateExistingRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized session' });
        return;
      }
      const { text, language, emotion } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'text is required' });
        return;
      }
      const trimmed = text.trim();
      if (trimmed.length > 4000) {
        res.status(400).json({ error: 'Message text is too long for speech playback' });
        return;
      }
      const result = await synthesizeMessageSpeech({
        userId,
        text: trimmed,
        languageHint: typeof language === 'string' ? language : null,
        emotionHint: typeof emotion === 'string' ? emotion : null,
      });
      res.json(result);
    } catch (err) {
      console.error('TTS endpoint error:', err);
      res.status(500).json({
        error: formatFriendlyAiError(err),
      });
    }
  });

  app.get('/api/payments/packages', (_req, res) => {
    const { configured: telegramBotConfigured, botUsername: telegramBotUsername } =
      getTelegramBotConfig();
    res.json({
      packages: STAR_PACKAGES,
      telegramBotConfigured,
      telegramBotUsername,
    });
  });

  app.post('/api/payments/create-invoice', async (req, res) => {
    try {
      const userId = authenticateExistingRequest(req);
      if (!userId) {
        res.status(401).json({ ok: false, error: 'Unauthorized session' });
        return;
      }
      const { packageId = 'pack_50' } = req.body ?? {};
      const result = await createTelegramStarsInvoice({
        userId,
        packageId: String(packageId),
      });

      if (result.invalidPackage) {
        res.status(400).json(result);
        return;
      }
      if (!result.configured) {
        res.status(503).json(result);
        return;
      }
      if (!result.ok) {
        res.status(502).json(result);
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to create Stars invoice',
      });
    }
  });

  app.get('/api/payments/status/:orderId', (req, res) => {
    const userId = authenticateExistingRequest(req);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized session' });
      return;
    }
    const order = getPaymentOrder(req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.userId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const tz = Number(req.query.tzOffsetMinutes || 0) || 0;
    const balance = getOrRefreshUserBalance(order.userId, tz);
    res.json({ order, balance });
  });

  app.post('/api/payments/verify', async (req, res) => {
    try {
      const userId = authenticateExistingRequest(req);
      if (!userId) {
        res.status(401).json({ paid: false, error: 'Unauthorized session' });
        return;
      }
      const { orderId, tzOffsetMinutes = 0 } = req.body ?? {};
      if (!orderId) {
        res.status(400).json({ error: 'orderId is required' });
        return;
      }
      const existingOrder = getPaymentOrder(String(orderId));
      if (!existingOrder) {
        res.status(404).json({ paid: false, error: 'Order not found' });
        return;
      }
      if (existingOrder.userId !== userId) {
        res.status(403).json({ paid: false, error: 'Forbidden' });
        return;
      }

      const result = await verifyOrderViaTelegramApi(
        String(orderId),
        Number(tzOffsetMinutes) || 0
      );
      const balance = result.order
        ? getOrRefreshUserBalance(result.order.userId, Number(tzOffsetMinutes) || 0)
        : null;
      res.json({ ...result, balance });
    } catch (err) {
      res.status(500).json({
        paid: false,
        error: err instanceof Error ? err.message : 'Payment verification error',
      });
    }
  });

  app.post('/api/telegram/webhook', async (req, res) => {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
    if (!expectedSecret) {
      res.status(503).json({
        ok: false,
        error: 'TELEGRAM_WEBHOOK_SECRET is not configured on the server',
      });
      return;
    }

    const incomingSecret =
      typeof req.headers['x-telegram-bot-api-secret-token'] === 'string'
        ? req.headers['x-telegram-bot-api-secret-token']
        : '';
    if (!timingSafeEqualStrings(incomingSecret, expectedSecret)) {
      res.status(401).json({ ok: false, error: 'Invalid webhook secret' });
      return;
    }

    try {
      const result = await processTelegramWebhookUpdate(req.body);
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('Telegram webhook error:', err);
      res.status(500).json({ ok: false });
    }
  });

  // Download endpoints for compiled single-file HTML, full source code bundle, and screen design screenshots
  app.get('/download/index.html', (req, res) => {
    const singleFilePath = path.resolve(process.cwd(), 'dist', 'singlefile', 'index.html');
    if (!fs.existsSync(singleFilePath)) {
      res.status(404).json({ error: 'Single-file build not found. Run npm run build first.' });
      return;
    }
    const inline = req.query.inline === '1' || req.query.inline === 'true';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      inline ? 'inline; filename="index.html"' : 'attachment; filename="index.html"'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(singleFilePath);
  });

  app.get('/download/nova-ai-code.zip', (_req, res) => {
    const zipPath = path.resolve(process.cwd(), 'dist', 'bundle', 'nova-ai-code.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'Code ZIP bundle not found. Run npm run build first.' });
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="nova-ai-code.zip"');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(zipPath);
  });

  app.get('/download/nova-ai-all-code.txt', (req, res) => {
    const txtPath = path.resolve(process.cwd(), 'dist', 'bundle', 'nova-ai-all-code.txt');
    if (!fs.existsSync(txtPath)) {
      res.status(404).json({ error: 'Combined source text not found. Run npm run build first.' });
      return;
    }
    const inline = req.query.inline === '1' || req.query.inline === 'true';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      inline ? 'inline; filename="nova-ai-all-code.txt"' : 'attachment; filename="nova-ai-all-code.txt"'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(txtPath);
  });

  app.get('/download/nova-ai-videos.zip', (_req, res) => {
    const videosZipPath = path.resolve(process.cwd(), 'dist', 'bundle', 'nova-ai-videos.zip');
    if (!fs.existsSync(videosZipPath)) {
      res.status(404).json({ error: 'Videos ZIP bundle not found. Run npm run build first.' });
      return;
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="nova-ai-videos.zip"');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(videosZipPath);
  });

  app.get('/download/videos-links.txt', (req, res) => {
    const forwardedProto =
      typeof req.headers['x-forwarded-proto'] === 'string'
        ? req.headers['x-forwarded-proto'].split(',')[0].trim()
        : req.protocol || 'https';
    const host =
      typeof req.headers['x-forwarded-host'] === 'string'
        ? req.headers['x-forwarded-host'].split(',')[0].trim()
        : req.headers.host || 'localhost:3000';
    const origin = `${forwardedProto}://${host}`;
    const lines = [
      `NOVA AI — ALL ${NOVA_EMOTION_CATALOG.length} EMOTION VIDEO FILES (.MP4)`,
      `Full ZIP archive: ${origin}/download/nova-ai-videos.zip`,
      '',
      ...NOVA_EMOTION_CATALOG.map(
        (item, idx) =>
          `${String(idx + 1).padStart(2, '0')}. ${item.id} (${item.label}) -> ${origin}/videos/${item.file}`
      ),
      '',
    ];
    const inline = req.query.inline === '1' || req.query.inline === 'true';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      inline ? 'inline; filename="videos-links.txt"' : 'attachment; filename="videos-links.txt"'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(lines.join('\n'));
  });

  const designAssetMap: Record<string, string> = {
    'design-desktop.png': 'nova-design-desktop.png',
    'design-chat.png': 'nova-design-chat.png',
    'design-mobile.png': 'nova-design-mobile.png',
  };

  app.get('/download/:assetName', (req, res, next) => {
    const targetFile = designAssetMap[req.params.assetName];
    if (!targetFile) {
      next();
      return;
    }
    const imgPath = path.resolve(
      process.cwd(),
      '.aistudio',
      'artifacts',
      'computer_use',
      targetFile
    );
    if (!fs.existsSync(imgPath)) {
      res.status(404).json({ error: 'Design screenshot not found.' });
      return;
    }
    const inline = req.query.inline === '1' || req.query.inline === 'true';
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      inline ? `inline; filename="${targetFile}"` : `attachment; filename="${targetFile}"`
    );
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(imgPath);
  });

  // Serve public assets & videos with Range request support for Android Chrome streaming
  app.use(
    express.static(path.resolve(process.cwd(), 'public'), {
      acceptRanges: true,
      maxAge: IS_PROD ? '7d' : 0,
    })
  );

  const server = http.createServer(app);
  attachLiveWebSocketServer(server);

  if (!IS_PROD) {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: disableHmr ? false : { server },
          ws: disableHmr ? false : undefined,
          watch: disableHmr ? null : undefined,
        },
        appType: 'spa',
      })
    );

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { acceptRanges: true }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.on('error', (err) => {
    console.error('HTTP server error:', err);
    process.exit(1);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVA AI server listening on http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start NOVA AI server:', err);
  process.exit(1);
});
