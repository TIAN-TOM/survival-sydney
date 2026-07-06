import mongoose, { HydratedDocument, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { SafeUser } from '../types/express';

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  setPassword(plain: string): Promise<void>;
  comparePassword(plain: string): Promise<boolean>;
  toSafeObject(): SafeUser;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (this: UserDocument, plain: string): Promise<void> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '', 10) || 10;
  this.passwordHash = await bcrypt.hash(plain, rounds);
};

userSchema.methods.comparePassword = async function (this: UserDocument, plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeObject = function (this: UserDocument): SafeUser {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

export default mongoose.model<IUser, UserModel>('User', userSchema);
