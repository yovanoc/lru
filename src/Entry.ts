import { Entry as EntryBase, NEWER, OLDER } from './types';

export default class Entry<K, V> implements EntryBase<K, V> {
  public key: K;
  public value: V;
  public [NEWER]: Entry<K, V> | undefined;
  public [OLDER]: Entry<K, V> | undefined;

  public constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
    this[NEWER] = undefined;
    this[OLDER] = undefined;
  }
}
