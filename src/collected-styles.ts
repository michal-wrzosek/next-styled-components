import { compile, serialize, stringify } from 'stylis';

function hash(text: string): string {
  let hash = 5381;
  let index = text.length;

  while (index) {
    hash = (hash * 33) ^ text.charCodeAt(--index);
  }

  return String(hash >>> 0);
}

export const CollectedStyles: {
  theme: Record<string, unknown>;
  counter: number;
  isOnClient: boolean;
  styles: Record<string, string>;
  keyframes: Record<string, string>;
  globalStyles: string;
  subscribers: (() => void)[];
  setTheme: (theme: Record<string, unknown>) => void;
  getClassName: () => string;
  getKeyframeName: () => string;
  setStyles: (className: string, css: string) => string;
  setKeyframe: (keyframeName: string, css: string) => string;
  setGlobalStyles: (css: string) => void;
  getStyles: () => string;
  subscribe: (callback: () => void) => { unsubscribe: () => void };
  pingSubscribers: () => void;
} = {
  theme: {},
  counter: 0,
  isOnClient: false,
  styles: {},
  keyframes: {},
  globalStyles: '',
  subscribers: [],
  setTheme: function (theme: Record<string, unknown>) {
    this.theme = theme;
    this.pingSubscribers();
  },
  getClassName: function () {
    this.counter++;
    return `sc-${this.isOnClient ? 'client' : 'server'}-${hash(this.counter.toString())}`;
  },
  getKeyframeName: function () {
    this.counter++;
    return `sc-${this.isOnClient ? 'client' : 'server'}-keyframe-${hash(this.counter.toString())}`;
  },
  setStyles: function (className: string, css: string) {
    this.styles[className] = css;
    this.pingSubscribers();
    return className;
  },
  setKeyframe: function (keyframeName: string, css: string) {
    this.keyframes[keyframeName] = css;
    this.pingSubscribers();
    return keyframeName;
  },
  setGlobalStyles: function (css: string) {
    this.globalStyles += ' ' + css;
    this.pingSubscribers();
  },
  subscribe: function (callback) {
    this.subscribers.push(callback);

    return { unsubscribe: () => this.subscribers.filter((subscriber) => subscriber !== callback) };
  },
  getStyles: function () {
    const keyframes = Object.entries(this.keyframes)
      .map(([key, value]) => {
        return `@keyframes ${key} { ${value} }`;
      })
      .join('\n');

    const styles = Object.entries(this.styles)
      .map(([key, value]) => {
        return `.${key} { ${value} }`;
      })
      .join('\n');

    return serialize(compile(keyframes + ' ' + this.globalStyles + ' ' + styles), stringify);
  },
  pingSubscribers: function () {
    // Async call to avoid "Cannot update a component while rendering a different component error"
    setTimeout(() => this.subscribers.forEach((subscriber) => subscriber()), 0);
  },
};
