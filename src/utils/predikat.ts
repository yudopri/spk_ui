export type RankPredikat = "Sangat Baik" | "Baik" | "Kurang";

export const getPredikatByRank = (rank: number, total: number): RankPredikat => {
  const r = Number(rank) || 0;
  const n = Number(total) || 0;
  if (n <= 0 || r <= 0) return "Kurang";
  const sangatBaikCutoff = Math.max(1, Math.floor(n * 0.1));
  const baikCutoff = Math.max(sangatBaikCutoff, Math.floor(n * 0.7));
  if (r <= sangatBaikCutoff) return "Sangat Baik";
  if (r <= baikCutoff) return "Baik";
  return "Kurang";
};
