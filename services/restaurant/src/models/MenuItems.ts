import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItems extends Document {
  restaurentId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  image: string;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IMenuItems>(
  {
    restaurentId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IMenuItems>("MenuItem", schema);
