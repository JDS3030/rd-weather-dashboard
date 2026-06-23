import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Servidor MSW para el entorno Node.js (Vitest corre en Node)
export const server = setupServer(...handlers);
