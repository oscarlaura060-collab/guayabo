// Emojis construidos por punto de código (fuente 100% ASCII). Así no se
// corrompen a "�" por temas de codificación en el build o el transporte.
const cp = (...c: number[]) => String.fromCodePoint(...c);

export const EMOJI = {
  saludo: cp(0x1f44b), // 👋
  sonrisa: cp(0x1f60a), // 😊
  cool: cp(0x1f60e), // 😎
  tarjeta: cp(0x1f4b3), // 💳
  sol: cp(0x2600, 0xfe0f), // ☀️
  palmera: cp(0x1f334), // 🌴
  llave: cp(0x1f511), // 🔑
  persona: cp(0x1f9d1), // 🧑
  alerta: cp(0x1f6a8), // 🚨
  camara: cp(0x1f4f8), // 📸
  usuario: cp(0x1f464), // 👤
  cedula: cp(0x1faaa), // 🪪
  movil: cp(0x1f4f2), // 📲
  correo: cp(0x1f4e7), // 📧
  pin: cp(0x1f4cd), // 📍
  bolsas: cp(0x1f6cd, 0xfe0f), // 🛍️
  chispas: cp(0x2728), // ✨
} as const;
