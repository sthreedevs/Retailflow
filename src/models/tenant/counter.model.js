import { Schema } from 'mongoose';

export const CounterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'counters',
    timestamps: true,
  }
);

/**
 * Returns the Counter model bound to a specific tenant connection.
 * @param {import('mongoose').Connection} connection
 */
export function getCounterModel(connection) {
  if (connection.models.Counter) {
    return connection.models.Counter;
  }
  return connection.model('Counter', CounterSchema);
}
