// Tek gerçeklik: renk, yumuşatma ve ritim burada. Bileşenlerde hex ya da
// easing yazılmaz. Palet uygulamanın kendi arayüzünden alındı (zinc + amber).
import { Easing } from "remotion";

export const theme = {
  renk: {
    zemin: "#0a0a0b",
    zeminUst: "#141417",
    metin: "#f4f4f5",
    ikincil: "#a1a1aa",
    soluk: "#71717a",
    vurgu: "#f59e0b", // amber-500 — kare başına yalnız bir öğede kullanılır
    dogru: "#34d399", // emerald-400
    cizgi: "#27272a",
  },
  yazi: {
    baslik: '"Inter Tight", "Segoe UI Semibold", system-ui, sans-serif',
    govde: '"Inter", "Segoe UI", system-ui, sans-serif',
  },
  egri: {
    // Doğrusal yumuşatma yasak; giriş yavaşlayarak, çıkış hızlanarak biter.
    giris: Easing.bezier(0.16, 1, 0.3, 1),
    cikis: Easing.bezier(0.7, 0, 0.84, 0),
  },
  yay: { damping: 200, mass: 0.7, stiffness: 110 },
  ritim: {
    kademe: 4, // ardışık öğeler arası kare farkı
    girisKare: 20,
    cikisKare: 10,
  },
} as const;
