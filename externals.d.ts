declare module '*.json';
declare module '*.svg';
declare module '*.png';

declare namespace NodeJS {
  interface ProcessEnv {
    GITHUB_TOKEN?: string;
  }
}
