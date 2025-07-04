require('@testing-library/jest-dom');

process.env.HUBSPOT_API_KEY = 'test-key';

// Polyfill for global.Headers in Node.js for Next.js API route tests
if (typeof global.Headers === 'undefined') {
  global.Headers = class {
    constructor(init = {}) {
      this.map = {};
      for (const key in init) {
        this.map[key.toLowerCase()] = init[key];
      }
    }
    get(name) {
      return this.map[name.toLowerCase()] || null;
    }
    set(name, value) {
      this.map[name.toLowerCase()] = value;
    }
    has(name) {
      return Object.prototype.hasOwnProperty.call(
        this.map,
        name.toLowerCase()
      );
    }
  };
}

// Polyfill for global.Request in Node.js for Next.js API route tests
if (typeof global.Request === 'undefined') {
  global.Request = function (input, init) {
    this.url = input;
    this.method = (init && init.method) || 'GET';
  };
}

// Polyfill for global.Response in Node.js for Next.js API route tests
if (typeof global.Response === 'undefined') {
  global.Response = class {
    constructor(body, init) {
      this.body = body;
      this.status = (init && init.status) || 200;
      this.headers = new global.Headers((init && init.headers) || {});
    }
    async json() {
      return typeof this.body === 'string'
        ? JSON.parse(this.body)
        : this.body;
    }
    static json(body, init) {
      return new global.Response(
        typeof body === 'object' ? JSON.stringify(body) : body,
        {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...(init && init.headers),
          },
        }
      );
    }
  };
}

// Centralized axios mock for all tests
import axios from 'axios';
jest.mock('axios');
