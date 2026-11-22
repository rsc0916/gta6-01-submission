// A small seeded random number generator (mulberry32): the same seed yields
// the same city, traffic and traffic pattern, which is what makes the
// screenshot scenes repeatable frame for frame.
// Also provides a few convenience helpers for common distributions.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandomWithHelpers(seed) {
  const random = createRandom(seed);
  return {
    random,
    // Uniform float in [0, 1)
    float: () => random(),
    // Uniform float in [lo, hi)
    range: (lo, hi) => lo + random() * (hi - lo),
    // Uniform int in [lo, hi] inclusive
    int: (lo, hi) => lo + Math.floor(random() * (hi - lo + 1)),
    // Boolean with probability p
    bool: (p = 0.5) => random() < p,
    // Pick random element from array
    pick: (arr) => arr[Math.floor(random() * arr.length)],
    // Shuffle array in place (Fisher-Yates)
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
}

