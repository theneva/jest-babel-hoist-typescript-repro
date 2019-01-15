import { RequestHandler } from 'express';

jest.mock('./index', () => {
  const fakeMiddleware: RequestHandler = (_req, _res, next) => next();

  return {
    middleware: fakeMiddleware,
  };
});

test('1+1', () => {
  expect(1 + 1).toBe(2);
});
