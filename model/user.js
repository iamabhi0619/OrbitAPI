const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    servicesAvailed: {
      type: [
        {
          serviceId: String,
          serviceName: String,
          firstUsedOn: Date,
          lastUsedOn: Date,
          usageCount: { type: Number, default: 0 },
          status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
          },
        },
      ],
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isNewsletters: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginHistory: {
      type: [
        {
          ip: String,
          device: String,
          timestamp: Date,
        },
      ],
      default: [],
    },
    activityLog: {
      type: [
        {
          action: String,
          timestamp: Date,
        },
      ],
      default: [],
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
