# Babel hoist TypeScript issue repro

This is (in my opinion) a reasonably configured TypeScript project that uses Jest.

## Config

It sets the following relevant TypeScript configuration (see `tsconfig.json`):

- `noImplicitAny`: `true` (to avoid buggy untyped code)
- `allowSyntheticDefaultImports`: `true` (to support ES-style exports)

We have the bare minimum of Babel config, which loads `@babel/preset-env` targeting `node`, and `@babel/preset-typescript` (see `.babelrc`).

There is no Jest configuration, so we're seeing the default behaviour that is

1. Read `.babelrc`, and apply specified presets/plugins and `babel-plugin-jest-hoist`
2. Perform the test run

## Test subject

The test subject is a module that exports an Express middleware which performs some work that is undesirable in a test run. In this case, it does `console.log('hi')`. My real case is a request logger that gets incredibly noisy when performing tests that send HTTP requests to the server.

## Test case

I want to mock the middleware exported from the test subject. Express (or Connect, if you prefer) requires a call to the `next` function in order to move on to the next middleware, so I can't just let Jest provide a mock function; I need to provide a fake middleware in place of the original one.

### Untyped solution

Jest is happy with this:

```ts
jest.mock('./index', () => {
  const fakeMiddleware = (_req, _res, next) => next();

  return {
    middleware: fakeMiddleware,
  };
});

test('1+1', () => {
  expect(1 + 1).toBe(2);
});
```

TypeScript, however, yells at me because `_req`, `_res`, and `next` are all untyped, and thus fail the `noImplicitAny` check:

![untyped version where variables are implicitly 'any'](https://raw.githubusercontent.com/theneva/jest-babel-hoist-typescript-repro/master/images/implicit-any.png)

### Typed solution

I can explicitly type `fakeMiddleware` as an `express.RequestHandler` like this:

```ts
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
```

This makes TypeScript happy. `jest`, on the other hand, is not:

![failed test run](https://raw.githubusercontent.com/theneva/jest-babel-hoist-typescript-repro/master/images/failed-jest-run.png)

## The problem

Since Jest does not perform any checks related to typings, it makes sense to me that type information should be stripped before mocks are hoisted. As Jest claims I reference an out-of-scope "variable" (actually a type), this does not seem to be the case. To me (and @simenb, who looked at this after I gave up), this seems like a bug. 
