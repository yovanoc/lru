import Entry from './Entry';
import { NEWER } from './types';

export default class EntryIterator<K, V> {
  private entry?: Entry<K, V>;
  public constructor(oldestEntry?: Entry<K, V>) {
    this.entry = oldestEntry;
  }

  public next(): IteratorResult<[K, V] | undefined> {
    const ent = this.entry;
    if (ent) {
      this.entry = ent[NEWER];
      return { done: false, value: [ent.key, ent.value] };
    } else {
      return { done: true, value: undefined };
    }
  }

  public [Symbol.iterator](): EntryIterator<K, V> {
    return this;
  }
}
