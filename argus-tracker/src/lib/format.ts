const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const money = (v: number) => usd0.format(Math.round(v) || 0);
export const int = (v: number) => num0.format(v);
export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
export const hours = (minutes: number) => (minutes / 60).toFixed(1);
