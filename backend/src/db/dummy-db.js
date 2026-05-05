const crypto = require('crypto');

function createId() {
  return crypto.randomUUID();
}

function toComparable(value) {
  if (value == null) return value;
  return String(value);
}

function matches(doc, query) {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [key, expected] of Object.entries(query)) {
    if (expected && typeof expected === 'object' && '$in' in expected) {
      const arr = expected.$in || [];
      if (!arr.map(toComparable).includes(toComparable(doc[key]))) return false;
      continue;
    }
    if (toComparable(doc[key]) !== toComparable(expected)) return false;
  }
  return true;
}

function parseSelect(selectStr) {
  if (!selectStr) return { include: null, exclude: new Set() };
  const tokens = String(selectStr)
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);

  const include = [];
  const exclude = new Set();
  for (const token of tokens) {
    if (token.startsWith('-')) exclude.add(token.slice(1));
    else include.push(token);
  }
  return { include: include.length ? new Set(include) : null, exclude };
}

function project(doc, selectStr) {
  const { include, exclude } = parseSelect(selectStr);
  const obj = { ...doc };

  if (include) {
    const projected = {};
    for (const k of include) projected[k] = obj[k];
    return projected;
  }

  for (const k of exclude) delete obj[k];
  return obj;
}

class DummyDocument {
  constructor(model, data) {
    this._model = model;
    Object.assign(this, data);
  }

  toObject() {
    const { _model, ...rest } = this;
    return { ...rest };
  }

  async save() {
    if (!this._id) this._id = createId();
    this._model._upsert(this);
    return this;
  }
}

class DummyQuery {
  constructor(model, kind, query) {
    this._model = model;
    this._kind = kind;
    this._query = query;
    this._select = null;
    this._populate = null;
    this._lean = false;
  }

  select(selectStr) {
    this._select = selectStr;
    return this;
  }

  populate(opts) {
    this._populate = opts;
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  async exec() {
    if (this._kind !== 'find') {
      throw new Error(`DummyQuery kind not supported: ${this._kind}`);
    }

    let docs = this._model._findMany(this._query);

    if (this._populate && this._populate.path) {
      docs = await Promise.all(docs.map(d => this._model._populateDoc(d, this._populate.path)));
    }

    if (this._select) {
      docs = docs.map(d => {
        const data = project(d.toObject ? d.toObject() : d, this._select);
        return this._lean ? data : new DummyDocument(this._model, data);
      });
      return docs;
    }

    if (this._lean) return docs.map(d => (d.toObject ? d.toObject() : { ...d }));
    return docs;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const stores = new Map();

function getStore(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name);
}

function createDummyModel(name, { populate = {} } = {}) {
  const store = getStore(name);

  class DummyModel {
    constructor(data) {
      return new DummyDocument(DummyModel, { ...data, _id: data && data._id ? String(data._id) : undefined });
    }

    static _upsert(doc) {
      const obj = doc.toObject ? doc.toObject() : { ...doc };
      const id = String(obj._id);
      store.set(id, { ...obj, _id: id });
    }

    static _findMany(query) {
      const results = [];
      for (const doc of store.values()) {
        if (matches(doc, query)) results.push(new DummyDocument(DummyModel, { ...doc }));
      }
      return results;
    }

    static async _populateDoc(doc, path) {
      const pop = populate[path];
      if (!pop) return doc;
      const id = doc[path];
      if (!id) return doc;
      const populated = await pop.findById(String(id));
      // keep as-is if missing
      if (!populated) return doc;
      const next = doc.toObject();
      next[path] = populated;
      return new DummyDocument(DummyModel, next);
    }

    static async create(data) {
      const doc = new DummyDocument(DummyModel, { ...data, _id: createId() });
      DummyModel._upsert(doc);
      return doc;
    }

    static async findOne(query) {
      for (const doc of store.values()) {
        if (matches(doc, query)) return new DummyDocument(DummyModel, { ...doc });
      }
      return null;
    }

    static async findById(id) {
      if (!id) return null;
      const doc = store.get(String(id));
      return doc ? new DummyDocument(DummyModel, { ...doc }) : null;
    }

    static find(query = {}) {
      return new DummyQuery(DummyModel, 'find', query);
    }

    static async findOneAndDelete(query) {
      for (const [id, doc] of store.entries()) {
        if (matches(doc, query)) {
          store.delete(id);
          return new DummyDocument(DummyModel, { ...doc });
        }
      }
      return null;
    }

    static async countDocuments(query) {
      let count = 0;
      for (const doc of store.values()) {
        if (matches(doc, query)) count++;
      }
      return count;
    }

    static _clearAll() {
      store.clear();
    }
  }

  return DummyModel;
}

function resetDummyDb() {
  for (const store of stores.values()) store.clear();
}

module.exports = {
  createDummyModel,
  resetDummyDb,
};
