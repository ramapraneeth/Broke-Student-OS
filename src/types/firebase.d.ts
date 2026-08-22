declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export class RecaptchaVerifier {
    constructor(auth: any, container: string | HTMLElement, parameters?: any);
    clear(): void;
    render(): Promise<number>;
    verify(): Promise<string>;
  }
  export interface ConfirmationResult {
    verificationId: string;
    confirm(verificationCode: string): Promise<any>;
  }
  export function signInWithPhoneNumber(
    auth: any,
    phoneNumber: string,
    appVerifier: any
  ): Promise<ConfirmationResult>;
}

declare module '@firebase/app' {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module '@firebase/auth' {
  export function getAuth(app?: any): any;
  export class RecaptchaVerifier {
    constructor(auth: any, container: string | HTMLElement, parameters?: any);
    clear(): void;
    render(): Promise<number>;
    verify(): Promise<string>;
  }
  export interface ConfirmationResult {
    verificationId: string;
    confirm(verificationCode: string): Promise<any>;
  }
  export function signInWithPhoneNumber(
    auth: any,
    phoneNumber: string,
    appVerifier: any
  ): Promise<ConfirmationResult>;
}
