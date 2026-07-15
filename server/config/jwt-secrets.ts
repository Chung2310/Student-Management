function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Biến môi trường ${name} chưa được thiết lập. Ứng dụng không thể khởi động an toàn.`);
  }
  return value;
}

export const ACCESS_SECRET = requireEnv("JWT_ACCESS_SECRET");
export const REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
