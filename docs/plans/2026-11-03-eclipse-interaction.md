# Eclipse interaction

Approved behavior: brighter corona and cursor-directed edge light on hover; click reveals the red moon, a restrained light sweep and 12 short-lived sparks, with brighter lanterns. Original black eclipse returns after 2.6 seconds. Repeat clicks cannot queue or extend a running cycle. No sound.

Implementation: a pure EclipseMotion state model drives the existing bounded Canvas renderer. A keyboard-accessible transparent button follows the rendered sun geometry. It disables pointer hit-testing while overlapping the result/sidebar regions during scroll. Hidden-tab and motion-preference changes reset the effect. Reduced-motion clicks toggle a static moon rather than starting a timer or particle motion.

Music: Guts Theme is not bundled. No recording was downloaded. Use requires appropriate permission for public distribution.

Validation: 38 unit tests pass. Local Chromium verified an actual pointer click starts the reveal, another click does not queue it, the original state returns, reduced-motion click redraws statically without a continuing loop, custom menus and management controls work, and 105 rows / mobile layout remain valid.
