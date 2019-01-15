import express from 'express';

export const middleware: express.RequestHandler = (_req, _res, next) => {
  console.log('hi');
  next();
};
