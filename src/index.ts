import Entry from './Entry';
import EntryIterator from './EntryIterator';
import KeyIterator from './KeyIterator';
import { IEntry, NEWER, OLDER } from './types';
import ValueIterator from './ValueIterator';

/**
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2019 Christopher Yovanovitch <https://devchris.me>
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */
export default class LRUMap<K, V> {
  // Current number of items
  public size: number;

  // Maximum number of items this map can hold
  public limit: number;

  // Least recently-used entry. Invalidated when map is modified.
  public oldest: Entry<K, V> | undefined;

  // Most recently-used entry. Invalidated when map is modified.
  public newest: Entry<K, V> | undefined;

  private keymap: Map<K, Entry<K, V>>;

  // Construct a new cache object which will hold up to limit entries.
  // When the size == limit, a `put` operation will evict the oldest entry.
  //
  // If `entries` is provided, all entries are added to the new map.
  // `entries` should be an Array or other iterable object whose elements are
  // key-value pairs (2-element Arrays). Each key-value pair is added to the new Map.
  // null is treated as undefined.
  constructor(limit?: number, entries?: Iterable<[K, V]>) {
    if (!limit) {
      limit = 0;
    }
    this.size = 0;
    this.limit = limit;
    this.oldest = this.newest = undefined;
    this.keymap = new Map();

    if (entries) {
      this.assign(entries);
      if (this.limit < 1) {
        this.limit = this.size;
      }
    }
  }

  // Replace all values in this map with key-value pairs (2-element Arrays) from
  // provided iterable.
  public assign(entries: Iterable<[K, V]>): void {
    let entry;
    let limit = this.limit || Number.MAX_VALUE;
    this.keymap.clear();
    const it = entries[Symbol.iterator]();
    for (let itv = it.next(); !itv.done; itv = it.next()) {
      const e = new Entry(itv.value[0], itv.value[1]);
      this.keymap.set(e.key, e);
      if (!entry) {
        this.oldest = e;
      } else {
        entry[NEWER] = e;
        e[OLDER] = entry;
      }
      entry = e;
      if (limit-- === 0) {
        throw new Error('overflow');
      }
    }
    this.newest = entry;
    this.size = this.keymap.size;
  }

  // Get and register recent use of <key>.
  // Returns the value associated with <key> or undefined if not in cache.
  public get(key: K): V | undefined {
    // First, find our cache entry
    const entry = this.keymap.get(key);
    if (!entry) {
      // Not cached. Sorry.
      return;
    }
    // As <key> was found in the cache, register it as being requested recently
    this._markEntryAsUsed(entry);
    return entry.value;
  }

  // Put <value> into the cache associated with <key>. Replaces any existing entry
  // with the same key. Returns `this`.
  public set(key: K, value: V): LRUMap<K, V> {
    let entry = this.keymap.get(key);

    if (entry) {
      // update existing
      entry.value = value;
      this._markEntryAsUsed(entry);
      return this;
    }

    // new entry
    this.keymap.set(key, (entry = new Entry(key, value)));

    if (this.newest) {
      // link previous tail to the new tail (entry)
      this.newest[NEWER] = entry;
      entry[OLDER] = this.newest;
    } else {
      // we're first in -- yay
      this.oldest = entry;
    }

    // add new entry to the end of the linked list -- it's now the freshest entry.
    this.newest = entry;
    ++this.size;
    if (this.size > this.limit) {
      // we hit the limit -- remove the head
      this.shift();
    }

    return this;
  }

  // Purge the least recently used (oldest) entry from the cache.
  // Returns the removed entry or undefined if the cache was empty.
  public shift(): [K, V] | undefined {
    // todo: handle special case when limit == 1
    const entry = this.oldest;
    if (entry) {
      if (this.oldest && this.oldest[NEWER]) {
        // advance the list
        this.oldest = this.oldest[NEWER]!;
        this.oldest[OLDER] = undefined;
      } else {
        // the cache is exhausted
        this.oldest = undefined;
        this.newest = undefined;
      }
      // Remove last strong reference to <entry> and remove links from the purged
      // entry being returned:
      entry[NEWER] = entry[OLDER] = undefined;
      this.keymap.delete(entry.key);
      --this.size;
      return [entry.key, entry.value];
    }
  }

  // ----------------------------------------------------------------------------
  // Following code is optional and can be removed without breaking the core
  // functionality.

  // Check if there's a value for key in the cache without registering recent use.
  public has(key: K): boolean {
    return this.keymap.has(key);
  }

  // Access value for <key> without registering recent use. Useful if you do not
  // want to chage the state of the map, but only "peek" at it.
  // Returns the value associated with <key> if found, or undefined if not found.
  public find(key: K): V | undefined {
    const e = this.keymap.get(key);
    return e ? e.value : undefined;
  }

  // Remove entry <key> from cache and return its value.
  // Returns the removed value, or undefined if not found.
  public delete(key: K): V | undefined {
    const entry = this.keymap.get(key);
    if (!entry) {
      return;
    }
    this.keymap.delete(entry.key);
    if (entry[NEWER] && entry[OLDER]) {
      // relink the older entry with the newer entry
      entry[OLDER]![NEWER] = entry[NEWER];
      entry[NEWER]![OLDER] = entry[OLDER];
    } else if (entry[NEWER]) {
      // remove the link to us
      entry[NEWER]![OLDER] = undefined;
      // link the newer entry to head
      this.oldest = entry[NEWER];
    } else if (entry[OLDER]) {
      // remove the link to us
      entry[OLDER]![NEWER] = undefined;
      // link the newer entry to head
      this.newest = entry[OLDER];
    } else {
      // if(entry[OLDER] === undefined && entry.newer === undefined) {
      this.oldest = this.newest = undefined;
    }

    this.size--;
    return entry.value;
  }

  // Removes all entries
  public clear(): void {
    // Not clearing links should be safe, as we don't expose live links to user
    this.oldest = this.newest = undefined;
    this.size = 0;
    this.keymap.clear();
  }

  // Returns an iterator over all keys, starting with the oldest.
  public keys(): KeyIterator<K, V> {
    return new KeyIterator(this.oldest);
  }

  // Returns an iterator over all values, starting with the oldest.
  public values(): ValueIterator<K, V> {
    return new ValueIterator(this.oldest);
  }

  // Returns an iterator over all entries, starting with the oldest.
  public entries() {
    return this;
  }

  // Returns an iterator over all entries, starting with the oldest.
  public [Symbol.iterator](): EntryIterator<K, V> {
    return new EntryIterator(this.oldest);
  }

  // Call `fun` for each entry, starting with the oldest entry.
  public forEach(fun: (value: V, key: K, m: LRUMap<K, V>) => void, thisObj?: any): void {
    if (typeof thisObj !== 'object') {
      thisObj = this;
    }
    let entry = this.oldest;
    while (entry) {
      fun.call(thisObj, entry.value, entry.key, this);
      entry = entry[NEWER];
    }
  }

  // Returns an object suitable for JSON encoding
  public toJSON(): Array<IEntry<K, V>> {
    const s = new Array(this.size);
    let i = 0;
    let entry = this.oldest;
    while (entry) {
      s[i++] = { key: entry.key, value: entry.value };
      entry = entry[NEWER];
    }
    return s;
  }

  // Returns a human-readable text representation
  public toString(): string {
    let s = '';
    let entry = this.oldest;
    while (entry) {
      s += String(entry.key) + ':' + entry.value;
      entry = entry[NEWER];
      if (entry) {
        s += ' < ';
      }
    }
    return s;
  }

  private _markEntryAsUsed(entry: Entry<K, V>) {
    if (entry === this.newest) {
      // Already the most recenlty used entry, so no need to update the list
      return;
    }
    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry[NEWER]) {
      if (entry === this.oldest) {
        this.oldest = entry[NEWER];
      }
      entry[NEWER]![OLDER] = entry[OLDER]; // C <-- E.
    }
    if (entry[OLDER]) {
      entry[OLDER]![NEWER] = entry[NEWER]; // C. --> E
    }
    entry[NEWER] = undefined; // D --x
    entry[OLDER] = this.newest; // D. --> E
    if (this.newest) {
      this.newest[NEWER] = entry; // E. <-- D
    }
    this.newest = entry;
  }
}
