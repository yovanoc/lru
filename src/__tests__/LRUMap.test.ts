import LRUMap from '../index';

test('Set & Get', () => {
  const c = new LRUMap<string, number>(4);
  expect(c.size).toBe(0);
  expect(c.limit).toBe(4);
  expect(c.oldest).toBe(undefined);
  expect(c.newest).toBe(undefined);

  c.set('adam', 29)
    .set('john', 26)
    .set('angela', 24)
    .set('bob', 48);

  expect(c.toString()).toBe('adam:29 < john:26 < angela:24 < bob:48');
  expect(c.size).toBe(4);

  expect(c.get('adam')).toBe(29);
  expect(c.get('john')).toBe(26);
  expect(c.get('angela')).toBe(24);
  expect(c.get('bob')).toBe(48);
  expect(c.toString()).toBe('adam:29 < john:26 < angela:24 < bob:48');

  expect(c.get('angela')).toBe(24);
  expect(c.toString()).toBe('adam:29 < john:26 < bob:48 < angela:24');

  c.set('ygwie', 81);
  expect(c.toString()).toBe('john:26 < bob:48 < angela:24 < ygwie:81');
  expect(c.size).toBe(4);
  expect(c.get('adam')).toBe(undefined);

  c.set('john', 11);
  expect(c.toString()).toBe('bob:48 < angela:24 < ygwie:81 < john:11');
  expect(c.get('john')).toBe(11);

  const expectedKeys = ['bob', 'angela', 'ygwie', 'john'];
  c.forEach((v, k) => {
    expect(k).toBe(expectedKeys.shift());
  });

  // removing one item decrements size by one
  const currentSize = c.size;
  expect(c.delete('john')).not.toBe(undefined);
  expect(currentSize - 1).toBe(c.size);
});

test('Construct with iterator', () => {
  const verifyEntries = (c: LRUMap<string, number>) => {
    expect(c.size).toBe(4);
    expect(c.limit).toBe(4);
    expect(c.oldest!.key).toBe('adam');
    expect(c.newest!.key).toBe('bob');
    expect(c.get('adam')).toBe(29);
    expect(c.get('john')).toBe(26);
    expect(c.get('angela')).toBe(24);
    expect(c.get('bob')).toBe(48);
  };

  // with explicit limit
  verifyEntries(new LRUMap(4, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]));

  // with inferred limit
  verifyEntries(new LRUMap(undefined, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]));
});

test('Assign', () => {
  const c = new LRUMap<string, number>(undefined, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]);

  const newEntries: Array<[string, number]> = [['mimi', 1], ['patrick', 2], ['jane', 3], ['fred', 4]];
  c.assign(newEntries);
  expect(c.size).toBe(4);
  expect(c.limit).toBe(4);
  expect(c.oldest!.key).toBe(newEntries[0][0]);
  expect(c.newest!.key).toBe(newEntries[newEntries.length - 1][0]);
  let i = 0;
  c.forEach((v, k) => {
    expect(k).toBe(newEntries[i][0]);
    expect(v).toBe(newEntries[i][1]);
    i++;
  });

  // assigning too many items should throw an exception
  expect(() => {
    c.assign([['adam', 29], ['john', 26], ['angela', 24], ['bob', 48], ['ken', 30]]);
  }).toThrowError('overflow');

  // assigning less than limit should not affect limit but adjust size
  c.assign([['adam', 29], ['john', 26], ['angela', 24]]);
  expect(c.size).toBe(3);
  expect(c.limit).toBe(4);
});

test('Delete', () => {
  const c = new LRUMap(undefined, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]);
  c.delete('adam');
  expect(c.size).toBe(3);
  c.delete('angela');
  expect(c.size).toBe(2);
  c.delete('bob');
  expect(c.size).toBe(1);
  c.delete('john');
  expect(c.size).toBe(0);
  expect(c.oldest).toBeUndefined();
  expect(c.newest).toBeUndefined();
});

test('Clear', () => {
  const c = new LRUMap(4);
  c.set('adam', 29);
  c.set('john', 26);
  expect(c.size).toBe(2);
  c.clear();
  expect(c.size).toBe(0);
  expect(c.oldest).toBeUndefined();
  expect(c.newest).toBeUndefined();
});

test('Shift', () => {
  const c2 = new LRUMap<string, number>(4);
  expect(c2.size).toBe(0);
  c2.set('a', 1);
  c2.set('b', 2);
  c2.set('c', 3);
  expect(c2.size).toBe(3);

  let e = c2.shift()!;
  expect(e[0]).toBe('a');
  expect(e[1]).toBe(1);

  e = c2.shift()!;
  expect(e[0]).toBe('b');
  expect(e[1]).toBe(2);

  e = c2.shift()!;
  expect(e[0]).toBe('c');
  expect(e[1]).toBe(3);

  // c2 should be empty
  c2.forEach(() => {
    expect(false);
  });
  expect(c2.size).toBe(0);
});

test('Set', () => {
  const c = new LRUMap<string, number>(4);
  c.set('a', 1);
  c.set('a', 2);
  c.set('a', 3);
  c.set('a', 4);
  expect(c.size).toBe(1);
  expect(c.newest).toBe(c.oldest);
  expect(c.newest).toMatchObject({ key: 'a', value: 4 });

  c.set('a', 5);
  expect(c.size).toBe(1);
  expect(c.newest).toBe(c.oldest);
  expect(c.newest).toMatchObject({ key: 'a', value: 5 });

  c.set('b', 6);
  expect(c.size).toBe(2);
  expect(c.newest).not.toBe(c.oldest);

  expect(c.newest).toMatchObject({ key: 'b', value: 6 });
  expect(c.oldest).toMatchObject({ key: 'a', value: 5 });

  c.shift();
  expect(c.size).toBe(1);
  c.shift();
  expect(c.size).toBe(0);
  c.forEach(() => {
    expect(false);
  });
});

test('Entry iterator', () => {
  const c = new LRUMap<string, number>(4, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]);

  const verifyEntries = (iterable: LRUMap<string, number>) => {
    expect(typeof iterable[Symbol.iterator]).toBe('function');
    const it = iterable[Symbol.iterator]();
    expect(it.next().value).toEqual(['adam', 29]);
    expect(it.next().value).toEqual(['john', 26]);
    expect(it.next().value).toEqual(['angela', 24]);
    expect(it.next().value).toEqual(['bob', 48]);
    expect(it.next().done).toBe(true);
  };

  verifyEntries(c);
  verifyEntries(c.entries());
});

test('Key iterator', () => {
  const c = new LRUMap<string, number>(4, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]);
  const kit = c.keys();
  expect(kit.next().value).toEqual('adam');
  expect(kit.next().value).toEqual('john');
  expect(kit.next().value).toEqual('angela');
  expect(kit.next().value).toEqual('bob');
  expect(kit.next().done).toBe(true);
});

test('Value iterator', () => {
  const c = new LRUMap<string, number>(4, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]);
  const kit = c.values();
  expect(kit.next().value).toEqual(29);
  expect(kit.next().value).toEqual(26);
  expect(kit.next().value).toEqual(24);
  expect(kit.next().value).toEqual(48);
  expect(kit.next().done).toBe(true);
});

test('toJSON', () => {
  const c = new LRUMap<string, number>(4, [['adam', 29], ['john', 26], ['angela', 24], ['bob', 48]]);
  const json = c.toJSON();
  expect(json.length).toBe(4);
  expect(json).toEqual([
    { key: 'adam', value: 29 },
    { key: 'john', value: 26 },
    { key: 'angela', value: 24 },
    { key: 'bob', value: 48 },
  ]);
});
