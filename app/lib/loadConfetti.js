let confettiLoadPromise = null;

export function loadConfetti() {
  if (typeof window !== 'undefined' && window.confetti) {
    return Promise.resolve(window.confetti);
  }
  if (confettiLoadPromise) return confettiLoadPromise;
  confettiLoadPromise = import('canvas-confetti').then((mod) => {
    const fn = mod.default || mod;
    if (typeof window !== 'undefined') window.confetti = fn;
    return fn;
  });
  return confettiLoadPromise;
}

export async function fireConfetti(options) {
  const confetti = await loadConfetti();
  return confetti(options);
}
