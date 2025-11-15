// This file provides types for `process.env` to align with the application's environment variable access method.
// Frontend environment variables are no longer used; configuration is hardcoded.

declare namespace NodeJS {
  interface ProcessEnv {
    // No frontend environment variables are needed.
  }
}
