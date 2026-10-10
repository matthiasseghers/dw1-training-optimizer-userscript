/**
 * Type declarations for asset imports. `@rollup/plugin-image` inlines these
 * as base64 data URI strings at build time.
 */

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
