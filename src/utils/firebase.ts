import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBZ0v9KPbMLy0TLYvwua3HbpJN4AZfvHfI",
  authDomain: "broke-os.firebaseapp.com",
  projectId: "broke-os",
  storageBucket: "broke-os.firebasestorage.app",
  messagingSenderId: "242076355016",
  appId: "1:242076355016:web:ae24ccf3d212471105d8fd",
  measurementId: "G-J8208CVZ2J"
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Global confirmation result reference
let globalConfirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Ensure the recaptcha DOM element exists
 */
const ensureRecaptchaContainer = (containerId: string = 'recaptcha-container'): HTMLElement => {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.style.position = 'fixed';
    el.style.bottom = '0';
    el.style.left = '0';
    el.style.zIndex = '99999';
    document.body.appendChild(el);
  }
  return el;
};

/**
 * Initialize Invisible reCAPTCHA verifier safely
 */
export const initRecaptchaVerifier = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  ensureRecaptchaContainer(containerId);

  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('✅ Google reCAPTCHA solved automatically');
    },
    'expired-callback': () => {
      console.warn('⚠️ Google reCAPTCHA expired, resetting...');
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {}
      }
      recaptchaVerifier = null;
    }
  });

  return recaptchaVerifier;
};

/**
 * Send real SMS verification code via Firebase
 */
export const sendRealSmsOtp = async (
  rawMobile: string,
  containerId: string = 'recaptcha-container'
): Promise<{ success: boolean; error?: string; isRealSms: boolean }> => {
  try {
    const cleanDigits = rawMobile.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.', isRealSms: false };
    }

    // Format phone number with country code (+91 for India)
    const formattedPhoneNumber = `+91${cleanDigits}`;

    // Set auth language for SMS
    firebaseAuth.languageCode = 'en';

    const verifier = initRecaptchaVerifier(containerId);
    await verifier.render();
    
    console.log(`📡 [Firebase Real SMS] Dispatching Google Telecom SMS to ${formattedPhoneNumber}...`);
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhoneNumber, verifier);
    globalConfirmationResult = confirmationResult;

    console.log(`✅ [Firebase Real SMS] Carrier SMS successfully dispatched to ${formattedPhoneNumber}!`);
    return { success: true, isRealSms: true };
  } catch (err: any) {
    console.error('❌ Firebase Phone Auth Error:', err);
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {}
      recaptchaVerifier = null;
    }

    let userFriendlyError = err?.message || 'Firebase SMS service unavailable.';
    if (err?.code === 'auth/invalid-phone-number') {
      userFriendlyError = 'Invalid phone number format.';
    } else if (err?.code === 'auth/quota-exceeded') {
      userFriendlyError = 'SMS quota temporarily exceeded. Please try again later.';
    } else if (err?.code === 'auth/captcha-check-failed') {
      userFriendlyError = 'reCAPTCHA verification failed. Please refresh.';
    } else if (err?.code === 'auth/too-many-requests') {
      userFriendlyError = 'Too many requests. Please wait a moment.';
    } else if (err?.code === 'auth/unauthorized-domain') {
      userFriendlyError = 'Domain not authorized in Firebase Console.';
    }

    return { success: false, error: userFriendlyError, isRealSms: false };
  }
};

/**
 * Confirm the OTP code received on the user's phone via Firebase
 */
export const verifyRealSmsOtp = async (otpCode: string): Promise<{ success: boolean; error?: string }> => {
  if (!globalConfirmationResult) {
    return { success: false, error: 'No active Firebase verification session.' };
  }

  try {
    const credential = await globalConfirmationResult.confirm(otpCode.trim());
    console.log('✅ [Firebase Auth] Phone verified successfully:', credential.user.phoneNumber);
    return { success: true };
  } catch (err: any) {
    console.error('❌ Firebase OTP Confirmation Error:', err);
    let msg = 'Incorrect verification code. Please check your SMS.';
    if (err?.code === 'auth/invalid-verification-code') {
      msg = 'Invalid 6-digit code. Please enter the exact code from your SMS.';
    } else if (err?.code === 'auth/code-expired') {
      msg = 'Verification code has expired. Please tap Resend Code.';
    }
    return { success: false, error: msg };
  }
};
