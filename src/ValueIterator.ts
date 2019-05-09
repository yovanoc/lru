import Entry from './Entry';
import { NEWER } from './types';

export default class ValueIterator<K, V> {
  private entry?: Entry<K, V>;
  public constructor(oldestEntry?: Entry<K, V>) {
    this.entry = oldestEntry;
  }

  public next(): IteratorResult<V | undefined> {
    const ent = this.entry;
    if (ent) {
      this.entry = ent[NEWER];
      return { done: false, value: ent.value };
    } else {
      return { done: true, value: undefined };
    }
  }

  public [Symbol.iterator](): ValueIterator<K, V> {
    return this;
  }
}
