// لون تقريبي لكل اسم لون شائع — للدائرة الصغيرة جنب اسم اللون فقط
const SWATCHES = {
  "أسود": "#1c1c1c", "اسود": "#1c1c1c", "black": "#1c1c1c",
  "أبيض": "#f5f5f2", "ابيض": "#f5f5f2", "white": "#f5f5f2",
  "رمادي": "#8a8f8c", "grey": "#8a8f8c", "gray": "#8a8f8c", "فضي": "#c0c4c6", "silver": "#c0c4c6",
  "أحمر": "#c62828", "احمر": "#c62828", "red": "#c62828",
  "أزرق": "#1f5fbf", "ازرق": "#1f5fbf", "blue": "#1f5fbf", "كحلي": "#1f2f57", "navy": "#1f2f57",
  "أخضر": "#2e7d32", "اخضر": "#2e7d32", "green": "#2e7d32",
  "أصفر": "#f2c230", "اصفر": "#f2c230", "yellow": "#f2c230", "ذهبي": "#c9a227", "gold": "#c9a227",
  "برتقالي": "#e8611f", "orange": "#e8611f",
  "بنفسجي": "#6a3fb5", "purple": "#6a3fb5", "وردي": "#e889b0", "pink": "#e889b0",
  "بني": "#7a4b2a", "brown": "#7a4b2a", "بيج": "#d8c7a5", "beige": "#d8c7a5",
  "شفاف": "#e6eef0", "clear": "#e6eef0",
};

export function swatchFor(name) {
  return SWATCHES[(name || "").trim().toLowerCase()] || "#b8bdb9";
}

// "أسود، أبيض, أحمر" → ["أسود","أبيض","أحمر"]
export function parseColors(text) {
  return [...new Set((text || "").split(/[,،\n]/).map((c) => c.trim()).filter(Boolean))].slice(0, 20);
}
