class InMemoryDatabase {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, value);
    return value;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async list(prefix) {
    const keys = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  async getByPrefix(prefix) {
    const results = [];
    const keys = await this.list(prefix);
    for (const key of keys) {
      const value = await this.get(key);
      if (value) {
        results.push(value);
      }
    }
    return results;
  }

  async clear() {
    this.store.clear();
  }
}

const db = new InMemoryDatabase();

module.exports = db;
