// Monara Sentinel - Public Check placeholder (Stage 1)
// Public intelligence services (no-auth) will be implemented with SCAMNET module
// This service is intentionally disabled until Phase 4 implementation

import pino from 'pino';

const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
});

export const publicCheckInfo = {
  name: 'Monara Sentinel Public Check',
  version: '0.1.0',
  status: 'stage-1-placeholder-disabled',
  purpose: 'Unauthenticated public intelligence checks (rate-limited, safe)',
  nextSteps: 'Implement isolated service with SSRF protection - separate from authenticated API (Phase 4)',
  note: 'Service disabled until Phase 4 implementation. This is intentional.',
};

async function main() {
  logger.info(publicCheckInfo, 'Public-check placeholder - service disabled until Phase 4');
  
  // Keep the process running to prevent Docker restart loop
  // In Phase 4, this will be replaced with actual implementation
  return new Promise<void>(() => {
    // Keep process alive indefinitely
    setInterval(() => {
      // Heartbeat log every hour to show service is running but idle
      logger.info({ status: 'idle', note: 'Service disabled until Phase 4' }, 'Public-check heartbeat');
    }, 3600000);
    // Never resolve - process stays alive
  });
}

if (require.main === module) {
  main().catch((err) => {
    logger.error({ err }, 'Public-check failed');
    process.exit(1);
  });
}

export default main;
