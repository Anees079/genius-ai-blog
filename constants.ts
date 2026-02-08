import { AspectRatio, ImageSize } from "./types";

export const ASPECT_RATIO_OPTIONS = [
  { value: AspectRatio.SQUARE, label: "Square (1:1)" },
  { value: AspectRatio.LANDSCAPE_16_9, label: "Widescreen (16:9)" },
  { value: AspectRatio.PORTRAIT_9_16, label: "Mobile (9:16)" },
  { value: AspectRatio.LANDSCAPE_4_3, label: "Standard (4:3)" },
  { value: AspectRatio.PORTRAIT_3_4, label: "Portrait (3:4)" },
  { value: AspectRatio.LANDSCAPE_3_2, label: "Classic 35mm (3:2)" },
  { value: AspectRatio.PORTRAIT_2_3, label: "Classic Portrait (2:3)" },
  { value: AspectRatio.CINEMATIC_21_9, label: "Cinematic (21:9)" },
];

export const IMAGE_SIZE_OPTIONS = [
  { value: ImageSize.SIZE_1K, label: "Standard (1K)" },
  { value: ImageSize.SIZE_2K, label: "High Res (2K)" },
  { value: ImageSize.SIZE_4K, label: "Ultra Res (4K)" },
];

export const TONE_OPTIONS = [
  "Professional",
  "Casual",
  "Enthusiastic",
  "Authoritative",
  "Humorous",
  "Empathetic"
];

export const AUDIENCE_OPTIONS = [
  "General Public",
  "Professionals",
  "Students",
  "Parents",
  "Tech Enthusiasts",
  "Business Owners"
];