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
  persona: cp(0x1f464), // 👤 (persona, compatible)
  alerta: cp(0x26a0, 0xfe0f), // ⚠️
  camara: cp(0x1f4f7), // 📷
  usuario: cp(0x1f464), // 👤
  cedula: cp(0x1f194), // 🆔 (la de "cédula" 🪪 es muy nueva y sale como cuadro)
  movil: cp(0x1f4f1), // 📱
  correo: cp(0x2709, 0xfe0f), // ✉️
  pin: cp(0x1f4cd), // 📍
  bolsas: cp(0x1f6cd, 0xfe0f), // 🛍️
  chispas: cp(0x2728), // ✨
} as const;
