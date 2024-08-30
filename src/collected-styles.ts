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
  subscribe: (callback: () => void) => void;
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
    this.subscribers.forEach((subscriber) => subscriber());
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
    this.subscribers.forEach((subscriber) => subscriber());
    return className;
  },
  setKeyframe: function (keyframeName: string, css: string) {
    this.keyframes[keyframeName] = css;
    this.subscribers.forEach((subscriber) => subscriber());
    return keyframeName;
  },
  setGlobalStyles: function (css: string) {
    this.globalStyles += ' ' + css;
    this.subscribers.forEach((subscriber) => subscriber());
  },
  subscribe: function (callback) {
    this.subscribers.push(callback);
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
};
