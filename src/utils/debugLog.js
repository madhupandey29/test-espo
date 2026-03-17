const isDebugLoggingEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true' ||
  process.env.DEBUG_DATA_FLOWS === 'true';

export const debugLog = (...args) => {
  if (isDebugLoggingEnabled) {
    console.log(...args);
  }
};
