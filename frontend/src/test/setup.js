import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Levantar MSW antes de todos los tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Resetear handlers después de cada test (evita que un test afecte al siguiente)
afterEach(() => server.resetHandlers());

// Cerrar MSW al terminar todos los tests
afterAll(() => server.close());
