import 'react';

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

declare global {
  namespace NodeJS {
    interface Process {
      browser: boolean;
    }
    interface Global {
      document: Document;
      window: Window;
      navigator: Navigator;
      fetch: any;
    }
  }
}

declare module '*.png' {
  const value: any;
  export = value;
}
declare module '*.svg' {
  const value: any;
  export = value;
}
