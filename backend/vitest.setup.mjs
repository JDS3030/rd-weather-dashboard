import { vi } from 'vitest';

// Alias de compatibilidad: los tests existentes usan jest.mock(), jest.fn(), etc.
globalThis.jest = vi;
