// An entry holds the key and value, and pointers to any older and newer entries.
export interface IEntry<K, V> {
  key: K;
  value: V;
}

export const NEWER = Symbol('newer');
export const OLDER = Symbol('older');
