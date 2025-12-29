/// <reference types="nativewind/types" />

interface RequireContext {
  keys(): string[];
  (id: string): any;
  resolve(id: string): string;
  id: string;
}

declare const require: {
  context(path: string, recursive?: boolean, filter?: RegExp): RequireContext;
};
