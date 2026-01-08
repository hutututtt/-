export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as Record<string, unknown>)[prop];
      if (value && typeof value === 'object') {
        deepFreeze(value);
      }
    });
    return Object.freeze(obj);
  }
  return obj;
}

export function frozenCopy<T>(obj: T): T {
  return deepFreeze(deepClone(obj));
}
