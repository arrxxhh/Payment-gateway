import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Transaction from '../models/Transaction.js';
import { authRequired, checkRole } from '../middleware/auth.js';
import { encryptText, decryptText, hashTxnId } from '../utils/crypto.js';

function safeDecrypt(fn) {
  try { return fn(); } catch (_e) { return null; }
}

const router = express.Router();

// Helper to randomize status with given probabilities
function randomStatus() {
  const r = Math.random();
  if (r < 0.8) return 'SUCCESS';
  if (r < 0.95) return 'FAILED';
  return 'PENDING';
}

// POST /api/checkout
router.post('/checkout', authRequired, async (req, res, next) => {
  try {
    const { amount, method, sandbox = false } = req.body || {};
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    if (!['UPI', 'Card'].includes(method)) {
      return res.status(400).json({ error: 'Method must be UPI or Card' });
    }

    const txnId = uuidv4();
    const status = randomStatus();
    const riskFlag = amount >= 50000 || Math.random() < 0.05;
    const userId = req.user?.sub || 'admin';
    const paymentLink = `https://pay.example.test/txn/${txnId}`;
    const txnDoc = await Transaction.create({
      txnIdEnc: encryptText(txnId),
      txnIdHash: hashTxnId(txnId),
      amountEnc: encryptText(amount),
      userIdEnc: encryptText(userId),
      userIdHash: hashTxnId(userId),
      method,
      status,
      timestamp: new Date(),
      sandbox: Boolean(sandbox),
      riskFlag,
      paymentLink,
    });

    return res.json({ txnId, status, paymentLink });
  } catch (err) {
    return next(err);
  }
});

// GET /api/transactions (filters)
router.get('/transactions', authRequired, async (req, res, next) => {
  try {
    const { status, method, userId, dateFrom, dateTo } = req.query;
    const query = {};
    if (status) query.status = status;
    if (method) query.method = method;
    if (userId) query.userIdHash = hashTxnId(String(userId));
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) query.timestamp.$lte = new Date(dateTo);
    }
    // Merchant can only see own transactions
    if (req.user?.role === 'Merchant') {
      query.userIdHash = hashTxnId(String(req.user.sub));
    }
    const docs = await Transaction.find(query).sort({ timestamp: -1 }).lean();
    const result = docs.map((d) => {
      const txnId = safeDecrypt(() => decryptText(d.txnIdEnc));
      const amount = safeDecrypt(() => Number(decryptText(d.amountEnc)));
      const userId = safeDecrypt(() => decryptText(d.userIdEnc));
      return {
        txnId: txnId ?? 'unavailable',
        amount: amount ?? 0,
        userId: userId ?? 'unknown',
        method: d.method,
        status: d.status,
        timestamp: d.timestamp,
        settlementDate: d.settlementDate,
        sandbox: d.sandbox,
        riskFlag: d.riskFlag,
        paymentLink: d.paymentLink,
      };
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

// GET /api/analytics
router.get('/analytics', authRequired, async (_req, res, next) => {
  try {
    const docs = await Transaction.find().lean();
    let total = 0;
    let success = 0;
    let failed = 0;
    let pending = 0;
    let settled = 0;
    let refunded = 0;
    let revenue = 0;

    const trendsByDay = new Map();

    for (const d of docs) {
      total += 1;
      const status = d.status;
      if (status === 'SUCCESS') success += 1;
      else if (status === 'FAILED') failed += 1;
      else if (status === 'PENDING') pending += 1;
      else if (status === 'REFUNDED') refunded += 1;
      // Treat any transaction with a settlementDate as settled
      if (d.settlementDate) settled += 1;

      const amount = safeDecrypt(() => Number(decryptText(d.amountEnc))) ?? 0;
      if (status === 'SUCCESS' || status === 'SETTLED') {
        revenue += amount;
      }

      const dayKey = new Date(d.timestamp);
      dayKey.setHours(0, 0, 0, 0);
      const key = dayKey.toISOString();
      const current = trendsByDay.get(key) || { total: 0, revenue: 0 };
      current.total += 1;
      if (status === 'SUCCESS' || status === 'SETTLED') current.revenue += amount;
      trendsByDay.set(key, current);
    }

    const trends = Array.from(trendsByDay.entries())
      .map(([date, v]) => ({ date, total: v.total, revenue: v.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.json({ total, success, failed, pending, settled, refunded, revenue, trends });
  } catch (err) {
    return next(err);
  }
});

// GET /api/analytics/methods
router.get('/analytics/methods', authRequired, async (_req, res, next) => {
  try {
    const docs = await Transaction.find().lean();
    const methods = { UPI: { count: 0, amount: 0 }, Card: { count: 0, amount: 0 } };
    for (const d of docs) {
      const amt = safeDecrypt(() => Number(decryptText(d.amountEnc))) ?? 0;
      methods[d.method].count += 1;
      methods[d.method].amount += (d.status === 'SUCCESS' || d.status === 'SETTLED') ? amt : 0;
    }
    return res.json(methods);
  } catch (err) { return next(err); }
});

// GET /api/analytics/settlement
router.get('/analytics/settlement', authRequired, async (_req, res, next) => {
  try {
    const total = await Transaction.countDocuments();
    const settled = await Transaction.countDocuments({ settlementDate: { $ne: null } });
    return res.json({ total, settled, ratio: total ? settled / total : 0 });
  } catch (err) { return next(err); }
});

// POST /api/payout (bulk settle)
router.post('/payout', authRequired, async (req, res, next) => {
  try {
    const { txnIds } = req.body || {};
    if (!Array.isArray(txnIds) || txnIds.length === 0) return res.status(400).json({ error: 'txnIds[] required' });
    const hashes = txnIds.map((t) => hashTxnId(String(t)));
    const docs = await Transaction.find({ txnIdHash: { $in: hashes }, status: 'SUCCESS' });
    const now = new Date();
    for (const d of docs) { d.settlementDate = now; }
    await Promise.all(docs.map((d) => d.save()));
    const result = docs.map((d) => ({
      txnId: decryptText(d.txnIdEnc),
      amount: Number(decryptText(d.amountEnc)),
      userId: decryptText(d.userIdEnc),
      method: d.method,
      status: d.status,
      settlementDate: d.settlementDate,
    }));
    return res.json({ updated: result.length, transactions: result });
  } catch (err) { return next(err); }
});

// POST /api/refund/:txnId (Admin or Merchant of own txn)
router.post('/refund/:txnId', authRequired, async (req, res, next) => {
  try {
    const { txnId } = req.params;
    const txnHash = hashTxnId(txnId);
    const doc = await Transaction.findOne({ txnIdHash: txnHash });
    if (!doc) return res.status(404).json({ error: 'Transaction not found' });
    if (!(doc.status === 'SUCCESS' || doc.status === 'SETTLED')) {
      return res.status(400).json({ error: 'Only successful/settled transactions can be refunded' });
    }
    if (req.user?.role === 'Merchant') {
      const isOwner = doc.userIdHash === hashTxnId(String(req.user.sub));
      if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
    }
    doc.status = 'REFUNDED';
    doc.settlementDate = null;
    await doc.save();
    return res.json({
      txnId,
      status: doc.status,
      amount: safeDecrypt(() => Number(decryptText(doc.amountEnc))) ?? 0,
      method: doc.method,
      timestamp: doc.timestamp,
    });
  } catch (err) { return next(err); }
});

// POST /api/settle/:txnId
router.post('/settle/:txnId', authRequired, async (req, res, next) => {
  try {
    const { txnId } = req.params;
    const txnHash = hashTxnId(txnId);
    const doc = await Transaction.findOne({ txnIdHash: txnHash });
    if (!doc) return res.status(404).json({ error: 'Transaction not found' });
    if (doc.status !== 'SUCCESS') {
      return res.status(400).json({ error: 'Only successful transactions can be settled' });
    }
    // Keep status as SUCCESS; only set settlementDate
    doc.settlementDate = new Date();
    await doc.save();
    const response = {
      txnId: decryptText(doc.txnIdEnc),
      amount: Number(decryptText(doc.amountEnc)),
      userId: decryptText(doc.userIdEnc),
      method: doc.method,
      status: doc.status,
      timestamp: doc.timestamp,
      settlementDate: doc.settlementDate,
    };
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

export default router;


