/**
 * Mock Chrome Extension MV3 API Harness
 * Provides full in-memory fidelity for chrome.storage, chrome.runtime,
 * chrome.tabs, chrome.windows, chrome.alarms, chrome.webNavigation, and chrome.scripting.
 */

export function createMockChrome() {
  const localStorage = new Map();
  const sessionStorage = new Map();
  const storageListeners = new Set();
  const runtimeListeners = new Set();
  const tabsUpdatedListeners = new Set();
  const tabsRemovedListeners = new Set();
  const windowsRemovedListeners = new Set();
  const webNavigationCompletedListeners = new Set();
  const alarmListeners = new Set();
  const alarms = new Map();

  function triggerStorageChange(changes, area) {
    for (const listener of storageListeners) {
      listener(changes, area);
    }
  }

  const storage = {
    local: {
      get: (keys, callback) => {
        let result = {};
        if (typeof keys === 'string') {
          result[keys] = localStorage.get(keys);
        } else if (Array.isArray(keys)) {
          for (const k of keys) {
            result[k] = localStorage.get(k);
          }
        } else if (keys && typeof keys === 'object') {
          for (const [k, defaultVal] of Object.entries(keys)) {
            result[k] = localStorage.has(k) ? localStorage.get(k) : defaultVal;
          }
        } else {
          result = Object.fromEntries(localStorage.entries());
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      },
      set: (items, callback) => {
        const changes = {};
        for (const [k, v] of Object.entries(items)) {
          changes[k] = { oldValue: localStorage.get(k), newValue: v };
          localStorage.set(k, v);
        }
        triggerStorageChange(changes, 'local');
        if (callback) callback();
        return Promise.resolve();
      },
      remove: (keys, callback) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          localStorage.delete(k);
        }
        if (callback) callback();
        return Promise.resolve();
      },
      clear: (callback) => {
        localStorage.clear();
        if (callback) callback();
        return Promise.resolve();
      },
    },
    session: {
      get: (keys, callback) => {
        let result = {};
        if (typeof keys === 'string') {
          result[keys] = sessionStorage.get(keys);
        } else if (Array.isArray(keys)) {
          for (const k of keys) {
            result[k] = sessionStorage.get(k);
          }
        } else if (keys && typeof keys === 'object') {
          for (const [k, defaultVal] of Object.entries(keys)) {
            result[k] = sessionStorage.has(k) ? sessionStorage.get(k) : defaultVal;
          }
        } else {
          result = Object.fromEntries(sessionStorage.entries());
        }
        if (callback) callback(result);
        return Promise.resolve(result);
      },
      set: (items, callback) => {
        const changes = {};
        for (const [k, v] of Object.entries(items)) {
          changes[k] = { oldValue: sessionStorage.get(k), newValue: v };
          sessionStorage.set(k, v);
        }
        triggerStorageChange(changes, 'session');
        if (callback) callback();
        return Promise.resolve();
      },
      remove: (keys, callback) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          sessionStorage.delete(k);
        }
        if (callback) callback();
        return Promise.resolve();
      },
      clear: (callback) => {
        sessionStorage.clear();
        if (callback) callback();
        return Promise.resolve();
      },
    },
    onChanged: {
      addListener: (fn) => storageListeners.add(fn),
      removeListener: (fn) => storageListeners.delete(fn),
    },
  };

  const runtime = {
    lastError: null,
    onMessage: {
      addListener: (fn) => runtimeListeners.add(fn),
      removeListener: (fn) => runtimeListeners.delete(fn),
    },
    sendMessage: (msg, callback) => {
      let responded = false;
      let lastResponse = undefined;
      for (const listener of runtimeListeners) {
        const sendResponse = (res) => {
          responded = true;
          lastResponse = res;
          if (callback) callback(res);
        };
        const willRespondAsync = listener(msg, { id: 'mock_extension', frameId: 0 }, sendResponse);
        if (!willRespondAsync && responded) break;
      }
      return Promise.resolve(lastResponse);
    },
    getManifest: () => ({
      name: 'FlowMacro — Web Automation & Selenium IDE Engine',
      version: '1.0.2',
      manifest_version: 3,
    }),
  };

  const tabsStore = new Map([
    [1024, { id: 1024, windowId: 1, url: 'https://app.supabase.com/login', status: 'complete' }],
    [1025, { id: 1025, windowId: 1, url: 'https://www.cvgenieats.com/', status: 'complete' }],
  ]);

  const tabs = {
    get: async (tabId) => {
      const tab = tabsStore.get(tabId);
      if (!tab) throw new Error(`No tab with id: ${tabId}`);
      return { ...tab };
    },
    query: async (queryInfo = {}) => {
      let list = Array.from(tabsStore.values());
      if (queryInfo.windowId !== undefined) {
        list = list.filter((t) => t.windowId === queryInfo.windowId);
      }
      if (queryInfo.active !== undefined) {
        list = list.slice(0, 1);
      }
      return list;
    },
    sendMessage: async (tabId, msg, options) => {
      // Broadcast to runtime listeners mimicking tab context
      let res;
      for (const listener of runtimeListeners) {
        const sendResponse = (r) => { res = r; };
        listener(msg, { tab: { id: tabId }, frameId: options?.frameId || 0 }, sendResponse);
      }
      return res;
    },
    onUpdated: {
      addListener: (fn) => tabsUpdatedListeners.add(fn),
      removeListener: (fn) => tabsUpdatedListeners.delete(fn),
      _trigger: (tabId, changeInfo, tab) => {
        if (tabsStore.has(tabId)) {
          Object.assign(tabsStore.get(tabId), changeInfo);
        }
        for (const l of tabsUpdatedListeners) l(tabId, changeInfo, tab || tabsStore.get(tabId));
      },
    },
    onRemoved: {
      addListener: (fn) => tabsRemovedListeners.add(fn),
      removeListener: (fn) => tabsRemovedListeners.delete(fn),
      _trigger: (tabId) => {
        tabsStore.delete(tabId);
        for (const l of tabsRemovedListeners) l(tabId);
      },
    },
  };

  const windowsStore = new Map([
    [1, { id: 1, focused: true, type: 'normal' }],
  ]);

  const windows = {
    get: async (winId) => {
      const win = windowsStore.get(winId);
      if (!win) throw new Error(`No window with id: ${winId}`);
      return { ...win };
    },
    create: async (createData) => {
      const newId = 100 + windowsStore.size + 1;
      const tabId = 2000 + newId;
      tabsStore.set(tabId, { id: tabId, windowId: newId, url: createData.url || 'about:blank', status: 'complete' });
      const win = {
        id: newId,
        focused: Boolean(createData.focused),
        type: createData.type || 'normal',
        tabs: [{ id: tabId, windowId: newId, url: createData.url || 'about:blank' }],
      };
      windowsStore.set(newId, win);
      return win;
    },
    update: async (winId, updateInfo) => {
      const win = windowsStore.get(winId);
      if (!win) throw new Error(`No window with id: ${winId}`);
      Object.assign(win, updateInfo);
      return win;
    },
    onRemoved: {
      addListener: (fn) => windowsRemovedListeners.add(fn),
      removeListener: (fn) => windowsRemovedListeners.delete(fn),
      _trigger: (winId) => {
        windowsStore.delete(winId);
        for (const l of windowsRemovedListeners) l(winId);
      },
    },
  };

  const alarmsApi = {
    create: (name, alarmInfo) => {
      alarms.set(name, { name, scheduledTime: Date.now() + (alarmInfo.periodInMinutes || 1) * 60000 });
    },
    clear: (name, callback) => {
      const existed = alarms.delete(name);
      if (callback) callback(existed);
      return Promise.resolve(existed);
    },
    get: (name, callback) => {
      const alarm = alarms.get(name);
      if (callback) callback(alarm);
      return Promise.resolve(alarm);
    },
    onAlarm: {
      addListener: (fn) => alarmListeners.add(fn),
      removeListener: (fn) => alarmListeners.delete(fn),
      _trigger: (alarmName) => {
        const alarm = alarms.get(alarmName) || { name: alarmName, scheduledTime: Date.now() };
        for (const l of alarmListeners) l(alarm);
      },
    },
  };

  const webNavigation = {
    onCompleted: {
      addListener: (fn) => webNavigationCompletedListeners.add(fn),
      removeListener: (fn) => webNavigationCompletedListeners.delete(fn),
      _trigger: (details) => {
        for (const l of webNavigationCompletedListeners) l(details);
      },
    },
  };

  const executedScripts = [];
  const scripting = {
    executeScript: async (injection) => {
      executedScripts.push(injection);
      return [{ result: true }];
    },
    _executedScripts: executedScripts,
  };

  return {
    storage,
    runtime,
    tabs,
    windows,
    alarms: alarmsApi,
    webNavigation,
    scripting,
  };
}
