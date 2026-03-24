import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  restaurentId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    restaurentId: {
      type: mongoose.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true },
);

schema.index({ userId: 1, restaurentId: 1, itemId: 1 }, { unique: true });

export default mongoose.model<ICart>("Cart",schema)