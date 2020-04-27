# Async Utilities

This project contains utilities one might use for Async work in ES2015 and later.

### Pool

Utility that completes as many simultaneous Promise resolutions as concurrency is defined. If you have expensive operations that do not need a stable result order for completion, then this utility is for you.

```typescript
async function pool<R, T>(
  items: Array<R>,
  iteratorFn: (item: R, items: Array<R>) => T,
  concurrency: number = cpus().length,
): Promise<Array<T>> {}
```

Passing an `Array<R> of items`, and an interator function that executes an expensive operation resulting in `T` will happen concurrently as determined by `concurrency`.
