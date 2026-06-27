// ============================================================
// Zed Tuition - Sticky Fullscreen Controller
// Ensures the app stays in fullscreen mode
// ============================================================

(function() {
  'use strict';

  // ─── Configuration ───
  const CONFIG = {
    // Try to auto-enter fullscreen on load
    autoEnter: true,
    // Re-enter fullscreen if user exits (sticky)
    sticky: true,
    // Lock orientation to prevent rotation issues
    lockOrientation: true,
    // Preferred orientation (portrait / landscape / any)
    orientation: 'any'
  };

  // ─── State ───
  let isFullscreen = false;
  let isLocked = false;
  let reentryTimeout = null;

  // ─── Check if we're in standalone mode (PWA) ───
  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }

  // ─── Enter Fullscreen ───
  function enterFullscreen() {
    const el = document.documentElement;

    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => {
        isFullscreen = true;
        console.log('[Fullscreen] ✅ Entered fullscreen mode');
        // Lock orientation after entering fullscreen
        if (CONFIG.lockOrientation) {
          lockOrientation();
        }
      }).catch(err => {
        // User likely denied or it's not allowed
        console.warn('[Fullscreen] ⚠️ Could not enter fullscreen:', err.message);
        isFullscreen = false;
      });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
      isFullscreen = true;
      if (CONFIG.lockOrientation) {
        lockOrientation();
      }
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
      isFullscreen = true;
      if (CONFIG.lockOrientation) {
        lockOrientation();
      }
    } else {
      console.warn('[Fullscreen] ⚠️ Fullscreen API not supported');
    }
  }

  // ─── Lock Orientation ───
  function lockOrientation() {
    if (!screen.orientation || !screen.orientation.lock) {
      // Try the older API
      if (screen.lockOrientation) {
        screen.lockOrientation(CONFIG.orientation);
        console.log('[Fullscreen] 🔒 Orientation locked:', CONFIG.orientation);
        return;
      }
      console.warn('[Fullscreen] ⚠️ Orientation lock not supported');
      return;
    }

    screen.orientation.lock(CONFIG.orientation)
      .then(() => {
        isLocked = true;
        console.log('[Fullscreen] 🔒 Orientation locked:', CONFIG.orientation);
      })
      .catch(err => {
        console.warn('[Fullscreen] ⚠️ Could not lock orientation:', err.message);
      });
  }

  // ─── Unlock Orientation ───
  function unlockOrientation() {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
      isLocked = false;
      console.log('[Fullscreen] 🔓 Orientation unlocked');
    }
  }

  // ─── Handle Fullscreen Change Events ───
  function handleFullscreenChange() {
    const isCurrentlyFullscreen = document.fullscreenElement ||
                                  document.webkitFullscreenElement ||
                                  document.msFullscreenElement;

    if (isCurrentlyFullscreen) {
      isFullscreen = true;
      console.log('[Fullscreen] ✅ Fullscreen active');
      // Re-lock orientation if needed
      if (CONFIG.lockOrientation && !isLocked) {
        lockOrientation();
      }
    } else {
      // User exited fullscreen
      isFullscreen = false;
      console.log('[Fullscreen] ❌ Fullscreen exited');

      // If sticky mode is on and we're in standalone, re-enter
      if (CONFIG.sticky && isInStandaloneMode()) {
        if (reentryTimeout) clearTimeout(reentryTimeout);
        reentryTimeout = setTimeout(() => {
          console.log('[Fullscreen] 🔄 Re-entering fullscreen (sticky)...');
          enterFullscreen();
          reentryTimeout = null;
        }, 300);
      }
    }
  }

  // ─── Handle Orientation Change ───
  function handleOrientationChange() {
    if (CONFIG.lockOrientation && isFullscreen) {
      // Re-lock orientation if it changed
      lockOrientation();
    }
  }

  // ─── Prevent accidental exit via keyboard (Esc) ───
  function preventEscExit(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      // Only prevent if we're in sticky mode and in standalone
      if (CONFIG.sticky && isInStandaloneMode()) {
        // Allow esc only if user double-taps it
        // For now, we just log it
        console.log('[Fullscreen] 🚫 Esc key pressed, but sticky mode prevents exit.');
        // Re-enter fullscreen if it was exited
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          e.preventDefault();
          enterFullscreen();
        }
      }
    }
  }

  // ─── Handle visibility change (re-enter on wake) ───
  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // If we're in standalone and not in fullscreen, re-enter
      if (CONFIG.sticky && isInStandaloneMode()) {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          console.log('[Fullscreen] 🔄 Re-entering fullscreen (visibility change)...');
          enterFullscreen();
        }
      }
    }
  }

  // ─── User gesture required for some browsers ───
  function requestFullscreenOnInteraction(e) {
    // Only if not already in fullscreen and not in standalone
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (!isInStandaloneMode()) {
        enterFullscreen();
      }
    }
    // Remove listeners after first successful fullscreen
    document.removeEventListener('click', requestFullscreenOnInteraction);
    document.removeEventListener('touchstart', requestFullscreenOnInteraction);
    document.removeEventListener('keydown', requestFullscreenOnInteraction);
  }

  // ─── Init ───
  function initFullscreen() {
    // Check if we're in standalone mode (PWA)
    const isStandalone = isInStandaloneMode();

    // Register event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    document.addEventListener('orientationchange', handleOrientationChange);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    document.addEventListener('keydown', preventEscExit);

    // If in standalone, auto-enter fullscreen
    if (isStandalone && CONFIG.autoEnter) {
      // Small delay to let the page load
      setTimeout(() => {
        enterFullscreen();
      }, 500);
    }

    // If not in standalone, set up user gesture listeners
    if (!isStandalone) {
      document.addEventListener('click', requestFullscreenOnInteraction);
      document.addEventListener('touchstart', requestFullscreenOnInteraction, { passive: true });
      document.addEventListener('keydown', requestFullscreenOnInteraction);
    }

    console.log('[Fullscreen] 🚀 Fullscreen controller initialized');
    console.log('[Fullscreen] 📱 Standalone mode:', isStandalone);
    console.log('[Fullscreen] 🔧 Sticky mode:', CONFIG.sticky);
  }

  // ─── Expose public methods ───
  window.ZedFullscreen = {
    enter: enterFullscreen,
    exit: function() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    },
    lockOrientation: lockOrientation,
    unlockOrientation: unlockOrientation,
    isFullscreen: () => isFullscreen,
    isLocked: () => isLocked,
    isStandalone: isInStandaloneMode
  };

  // ─── Auto-init ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFullscreen);
  } else {
    initFullscreen();
  }

})();