import { Schema } from 'mongoose';

export const ImportHistorySchema = new Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['CSV', 'XLSX', 'XLS'],
      default: 'CSV',
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    importedRows: {
      type: Number,
      default: 0,
    },
    failedRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PARTIAL', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
    rowErrors: [
      {
        rowNumber: Number,
        productName: String,
        error: String,
        rawData: Schema.Types.Mixed,
      },
    ],
    importedBy: {
      userId: String,
      email: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'import_history',
  }
);

ImportHistorySchema.index({ createdAt: -1 });

/**
 * Returns the ImportHistory model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getImportHistoryModel(connection) {
  if (connection.models.ImportHistory) {
    return connection.models.ImportHistory;
  }
  return connection.model('ImportHistory', ImportHistorySchema);
}
