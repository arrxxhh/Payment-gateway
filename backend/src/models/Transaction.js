import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    txnIdEnc: { type: String, required: true }, // encrypted txnId
    txnIdHash: { type: String, required: true, index: true }, // hash for lookup
    amountEnc: { type: String, required: true }, // encrypted amount
    userIdEnc: { type: String, required: true }, // encrypted user identifier
    userIdHash: { type: String, required: true, index: true },
    method: { type: String, enum: ['UPI', 'Card'], required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING', 'SETTLED', 'REFUNDED'],
      required: true,
    },
    timestamp: { type: Date, default: () => new Date() },
    settlementDate: { type: Date },
    sandbox: { type: Boolean, default: false },
    paymentLink: { type: String },
  },
  { collection: 'transactions' }
);

export default mongoose.model('Transaction', TransactionSchema);


