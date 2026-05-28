export function isEmail(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isPasswordValid(value: string): boolean {
  const v = value ?? "";
  return v.length >= 6 && v.length <= 14;
}

export function clamp100(value: string): string {
  return value.length <= 100 ? value : value.slice(0, 100);
}
