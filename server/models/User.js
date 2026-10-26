import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role:{
        type:String,
        enum: ['user','admin'],
        default:"user"
    },

    // Incremented on password change; tokens carrying an older
    // value are rejected, which logs out every other device.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // One-time email code (stored as a SHA-256 hash).
    // purpose is "login" or "enable" so a code can't be reused for the other flow.
    // Load it with .select("+twoFactorCode").
    twoFactorCode: {
      type: new mongoose.Schema(
        {
          hash: String,
          purpose: { type: String, enum: ["login", "enable"] },
          expiresAt: Date,
          attempts: { type: Number, default: 0 },
          sentAt: Date,
        },
        { _id: false }
      ),
      select: false,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.twoFactorCode;
        delete ret.tokenVersion;
        return ret;
      },
    },

    toObject: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.twoFactorCode;
        delete ret.tokenVersion;
        return ret;
      },
    },
  }
);

const User = mongoose.model("User", userSchema);

export default User;