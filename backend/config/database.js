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
    const results = [];
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value);
      }
    }
    return results;
  }

  async getByPrefix(prefix, filterFn = null) {
    const results = [];
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        if (!filterFn || filterFn(key, value)) {
          results.push(value);
        }
      }
    }
    return filterFn && results.length === 1 ? results[0] : results.length > 0 ? results : null;
  }

  async clear() {
    this.store.clear();
  }
}

const db = new InMemoryDatabase();

module.exports = db;
