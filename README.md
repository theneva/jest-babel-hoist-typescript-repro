# Babel hoist TypeScript issue repro

This is what is (in my opinion) a reasonably configured TypeScript project that uses Jest for tests.

## Config

It sets the following relevant TypeScript configuration (see `tsconfig.json`):

- `noImplicitAny`: `true` (to avoid buggy untyped code)
- `allowSyntheticDefaultImports`: `true` (to support ES-style exports)

We have the bare minimum of Babel config, which loads `@babel/preset-env` targeting `node`, and `@babel/preset-typescript` (see `.babelrc`).

There is no Jest configuration, so we're seeing the default behaviour that is

1. Read `.babelrc`
2. Hoist mocks using `babel-plugin-jest-hoist`
3. Perform the test run

## Test subject

The test subject is a module that exports an Express middleware which performs some work that is undesirable in a test run. In this case, it does `console.log('hi')`. My real case is a request logger that gets incredibly noisy when performing tests that actually send HTTP requests.

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

__implicit-any image placeholder__

### Typed solution

I can explicitly type `fakeMiddleware` as an `express.RequestHandler` like this:

__typed image placeholder__

This makes TypeScript happy. `jest`, on the other hand, is not:

__failed-jest-run image placeholder__

## The problem

Since Jest does not perform any checks related to typings, it makes sense to me that type information should be stripped before hoisting of mocks is performed. As Jest claims I reference an out-of-scope "variable" (actually a type), this does not seem to be the case. To me (and @simenb, who looked at this after I gave up), this seems like a bug. 
