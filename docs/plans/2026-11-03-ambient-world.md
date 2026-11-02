# Ambient pixel world

User request: keep the creator emblem visible at the lower left during scrolling; add subtle polished motion and a pixel-world background with passing essences.

Implementation: fixed decorative emblem with a reserved left rail at every breakpoint. Fixed, pointer-transparent low-resolution Canvas 2D scene: stepped moon, layered mountains, pagoda silhouettes, tree and 22 drifting particles. Single requestAnimationFrame loop, drawing at most 24 times per second, paused while hidden and static with prefers-reduced-motion. No WebGL, dependencies, remote images or background requests.

UI motion: short fade/translation on initial content, restrained hover/press scaling and menu reveal. Reduced-motion styles override all effects.

Validation: 34 tests and isolated local Chromium fixture. Verified fixed emblem stays outside content during a long-page scroll, canvas dimensions are one third viewport resolution, reduced-motion stops canvas drawing and CSS animations, management/menu controls work, 105 rows expand vertically, and 390px layout has no horizontal page overflow. Authenticated Reddit behavior is outside this visual change.
