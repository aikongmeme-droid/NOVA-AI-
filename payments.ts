import crypto from 'node:crypto';
import { getStarPackage, type StarPackage } from '../src/shared/billing';
import {
  createPaymentOrder,
  creditPaidMinutesAtomic,
  getPaymentOrder,
  updatePaymentOrderInvoiceUrl,
} from './db';

export function getTelegramBotConfig(): {
  configured: boolean;
  botUsername: string | null;
} {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '') || null;
  return {
    configured: Boolean(botToken),
    botUsername,
  };
}

export function verifyTelegramWebAppInitData(
  initData: string
): { valid: boolean; telegramUserId?: string } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken || !initData) {
    return { valid: false };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (hash !== expectedHash) {
      return { valid: false };
    }

    const userRaw = params.get('user');
    if (userRaw) {
      const userObj = JSON.parse(userRaw) as { id?: number | string };
      if (userObj?.id) {
        return { valid: true, telegramUserId: `tg_${userObj.id}` };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export async function createTelegramStarsInvoice(params: {
  userId: string;
  packageId: string;
}): Promise<{
  ok: boolean;
  configured: boolean;
  invalidPackage?: boolean;
  selectedPackage?: StarPackage;
  order?: ReturnType<typeof createPaymentOrder>;
  botUsername: string | null;
  error?: string;
}> {
  const pkg = getStarPackage(params.packageId);
  const { configured, botUsername } = getTelegramBotConfig();
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!pkg) {
    return {
      ok: false,
      configured,
      invalidPackage: true,
      botUsername,
      error: 'Invalid Stars package selected.',
    };
  }

  if (!botToken) {
    return {
      ok: false,
      configured: false,
      selectedPackage: pkg,
      botUsername,
      error:
        'TELEGRAM_BOT_TOKEN is not configured on the server. Connect your Telegram Bot to issue live XTR Stars invoices.',
    };
  }

  const orderId = `nova_${crypto.randomBytes(12).toString('hex')}`;
  const order = createPaymentOrder({
    orderId,
    userId: params.userId,
    minutes: pkg.minutes,
    seconds: pkg.seconds,
    starsAmount: pkg.stars,
    invoiceUrl: null,
  });

  const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `NOVA AI — ${pkg.minutes} Minutes`,
      description: `${pkg.minutes} voice conversation minutes with NOVA (${pkg.stars} Telegram Stars)`,
      payload: orderId,
      provider_token: '',
      currency: 'XTR',
      prices: [
        {
          label: `${pkg.minutes} Minutes`,
          amount: pkg.stars,
        },
      ],
    }),
  });

  const tgData = (await tgResp.json()) as {
    ok: boolean;
    result?: string;
    description?: string;
  };

  if (!tgResp.ok || !tgData.ok || !tgData.result) {
    return {
      ok: false,
      configured: true,
      selectedPackage: pkg,
      order,
      botUsername,
      error: tgData.description || 'Failed to create Telegram Stars invoice link.',
    };
  }

  updatePaymentOrderInvoiceUrl(orderId, tgData.result);
  const updatedOrder = getPaymentOrder(orderId)!;

  return {
    ok: true,
    configured: true,
    selectedPackage: pkg,
    order: updatedOrder,
    botUsername,
  };
}

export async function verifyOrderViaTelegramApi(
  orderId: string,
  tzOffsetMinutes = 0
): Promise<{
  paid: boolean;
  order: ReturnType<typeof getPaymentOrder>;
  alreadyProcessed?: boolean;
  error?: string;
}> {
  const order = getPaymentOrder(orderId);
  if (!order) {
    return { paid: false, order: null, error: 'Order not found' };
  }
  if (order.status === 'paid') {
    return { paid: true, order, alreadyProcessed: true };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return {
      paid: false,
      order,
      error: 'TELEGRAM_BOT_TOKEN is not configured on the server.',
    };
  }

  // Fallback direct verification via Bot API getStarTransactions in case webhook was not delivered
  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${botToken}/getStarTransactions?limit=100`
    );
    const data = (await resp.json()) as {
      ok: boolean;
      result?: {
        transactions?: Array<{
          id: string;
          amount: number;
          source?: {
            type?: string;
            invoice_payload?: string;
          };
        }>;
      };
    };

    if (data.ok && data.result?.transactions) {
      const match = data.result.transactions.find(
        (tx) =>
          tx.source?.invoice_payload === orderId && tx.amount >= order.starsAmount
      );
      if (match) {
        const result = creditPaidMinutesAtomic({
          orderId,
          telegramChargeId: match.id,
          paidStarsAmount: match.amount,
          tzOffsetMinutes,
        });
        return {
          paid: result.credited || result.alreadyProcessed,
          order: getPaymentOrder(orderId),
          alreadyProcessed: result.alreadyProcessed,
        };
      }
    }
  } catch (err) {
    return {
      paid: false,
      order,
      error: err instanceof Error ? err.message : 'Verification request failed',
    };
  }

  return { paid: false, order };
}

export async function processTelegramWebhookUpdate(update: {
  pre_checkout_query?: {
    id: string;
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  message?: {
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
    };
  };
}): Promise<{ handled: boolean; action?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query;
    const order = getPaymentOrder(q.invoice_payload);
    const isValid =
      Boolean(order) &&
      order!.status === 'pending' &&
      q.currency === 'XTR' &&
      q.total_amount >= order!.starsAmount;

    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pre_checkout_query_id: q.id,
          ok: isValid,
          error_message: isValid
            ? undefined
            : 'Order is invalid, expired, or already paid.',
        }),
      });
    }
    return { handled: true, action: isValid ? 'pre_checkout_approved' : 'pre_checkout_rejected' };
  }

  if (update.message?.successful_payment) {
    const payment = update.message.successful_payment;
    if (payment.currency !== 'XTR') {
      return { handled: false };
    }
    const result = creditPaidMinutesAtomic({
      orderId: payment.invoice_payload,
      telegramChargeId: payment.telegram_payment_charge_id,
      paidStarsAmount: payment.total_amount,
    });
    return {
      handled: true,
      action: result.credited
        ? 'credited'
        : result.alreadyProcessed
          ? 'duplicate_ignored'
          : result.reason,
    };
  }

  return { handled: false };
}
