import Entry from './Entry';
import { NEWER } from './types';

export default class KeyIterator<K, V> {
  private entry?: Entry<K, V>;
  constructor(oldestEntry?: Entry<K, V>) {
    this.entry = oldestEntry;
  }

  public next(): IteratorResult<K | undefined> {
    const ent = this.entry;
    if (ent) {
      this.entry = ent[NEWER];
      return { done: false, value: ent.key };
    } else {
      return { done: true, value: undefined };
    }
  }

  public [Symbol.iterator]() {
    return this;
  }
}
