const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  poster: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  genres: {
    type: String,
    required: true,
  },
  cast: {
    type: String,
    default: "",
  },
  director: {
    type: String,
    default: "",
  },
  rating: {
    type: String,
    default: "16+",
  },
  year: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    default: "1ч 30м",
  },
  quality: {
    type: String,
    enum: ["HD", "4K", "SD"],
    default: "HD",
  },
  type: {
    type: String,
    enum: ["trending", "popular", "newReleases"],
    default: "trending",
  },
  videos: {
    fhd: {
      type: String,
      default: null,
    },
    hd: {
      type: String,
      default: null,
    },
    sd: {
      type: String,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Виртуальное свойство для обратной совместимости
MovieSchema.virtual("videoPath").get(function () {
  return this.videos && this.videos.fhd ? this.videos.fhd : null;
});

// Устанавливаю toJSON и toObject опции для включения виртуальных свойств
MovieSchema.set("toJSON", { virtuals: true });
MovieSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Movie", MovieSchema);
