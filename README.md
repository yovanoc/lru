# Least Recently Used (LRU) cache algorithm

A finite key-value map using the Least Recently Used (LRU) algorithm, where the most recently-used items are "kept alive" while older, less-recently used items are evicted to make room for newer items.

Useful when you want to limit use of memory to only hold commonly-used things.

[![CircleCI Build](https://img.shields.io/circleci/project/github/yovanoc/lru.svg?style=flat-square)](https://circleci.com/gh/yovanoc/lru)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/yovanoc/lru/coverage.svg?style=flat-square)](https://codecov.io/gh/yovanoc/lru/)

## Terminology & design

- Based on a doubly-linked list for low complexity random shuffling of entries.

- The cache object iself has a "head" (least recently used entry) and a
  "tail" (most recently used entry).

- The "oldest" and "newest" are list entries -- an entry might have a "newer" and
  an "older" entry (doubly-linked, "older" being close to "head" and "newer"
  being closer to "tail").

- Key lookup is done through a key-entry mapping native object, which on most 
  platforms mean `O(1)` complexity. This comes at a very low memory cost  (for 
  storing two extra pointers for each entry).

Fancy ASCII art illustration of the general design:

```txt
           entry             entry             entry             entry
           ______            ______            ______            ______
          | head |.newer => |      |.newer => |      |.newer => | tail |
.oldest = |  A   |          |  B   |          |  C   |          |  D   | = .newest
          |______| <= older.|______| <= older.|______| <= older.|______|

       removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
```

## Example

```js
let c = new LRUMap(3)
c.set('adam',   29)
c.set('john',   26)
c.set('angela', 24)
c.toString()        // -> "adam:29 < john:26 < angela:24"
c.get('john')       // -> 26

// Now 'john' is the most recently used entry, since we just requested it
c.toString()        // -> "adam:29 < angela:24 < john:26"
c.set('zorro', 141) // -> {key:adam, value:29}

// Because we only have room for 3 entries, adding 'zorro' caused 'adam'
// to be removed in order to make room for the new entry
c.toString()        // -> "angela:24 < john:26 < zorro:141"
```

## Usage

**Using NPM:** [`yarn add @devchris/lru`](https://www.npmjs.com/package/@devchris/lru)