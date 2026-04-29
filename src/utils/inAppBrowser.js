/**
 * inAppBrowser.js
 *
 * Detects social media in-app browsers that block Google OAuth.
 * Google explicitly disallows OAuth inside embedded WebViews and many
 * in-app browsers (Facebook, Instagram, LinkedIn, Twitter/X).
 *
 * Detection strategy: UA string token matching, ordered by prevalence.
 * Runs once and is cached — safe to call frequently.
 */

const UA = typeof navigator !== "undefined" ? navigator.userAgent : "";

// Tokens that unambiguously identify a restricted in-app browser.
// Each entry: [token, displayName]
const IN_APP_TOKENS = [
  // Facebook / Instagram (Meta)
  // Meta's WebView always injects FBAN or FBAV; Instagram injects Instagram/
  [/FBAN|FBAV/i,      "Facebook"],
  [/Instagram/i,      "Instagram"],
  // LinkedIn
  [/LinkedInApp/i,    "LinkedIn"],
  // Twitter / X
  [/Twitter(?:bot)?/i, "Twitter"],
  // Generic Android/iOS WebView markers used by less-known apps
  // Only flag when NOT a standalone Chrome/Safari browser.
  [/\bwv\b/,          null], // Android WebView — flag only if no Chrome label
];

function detectInAppBrowser() {
  // Fast path: no UA (SSR / test env)
  if (!UA) return { detected: false, appName: null };

  for (const [pattern, name] of IN_APP_TOKENS) {
    if (pattern.test(UA)) {
      // For the generic Android WebView (\bwv\b) token we need an extra guard:
      // Chrome for Android injects "wv" too when wrapping PWA tiles — but it
      // ALSO contains "Chrome/" in the UA. We skip those to avoid false positives.
      if (name === null) {
        const isActualWebView = /wv/.test(UA) && !/Chrome\//.test(UA);
        if (!isActualWebView) continue;
        return { detected: true, appName: "this app" };
      }
      return { detected: true, appName: name };
    }
  }

  return { detected: false, appName: null };
}

// Cached result — computed once per page load.
export const inAppBrowserInfo = detectInAppBrowser();

/**
 * Returns true when the page is running inside a restricted in-app browser.
 */
export function isInAppBrowser() {
  return inAppBrowserInfo.detected;
}

/**
 * Returns the name of the detected in-app browser app (e.g. "Facebook"),
 * or null if not detected.
 */
export function getInAppBrowserName() {
  return inAppBrowserInfo.appName;
}
