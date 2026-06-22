import React from 'react';
import { Button, Error } from '@trinserhof/ui';
import { logIn } from '@trinserhof/database';

const GOOGLE_LOGIN_ERROR_MESSAGES: Record<string, string> = {
  'auth/unauthorized-domain':
    'Google sign-in is not enabled for this domain. Please contact the site administrator.',
  'auth/popup-blocked':
    'Your browser blocked the sign-in popup. Please allow popups for this site and try again.',
};

const DEFAULT_GOOGLE_LOGIN_ERROR_MESSAGE =
  'Something went wrong signing in with Google. Please try again.';

export const LoginForm = () => {
  const [loginError, setLoginError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 w-80">
      {loginError && <Error message={loginError} />}

      <Button
        variant="outline"
        onClick={() => {
          setLoginError(null);
          logIn((errorCode) => {
            if (
              errorCode === 'auth/popup-closed-by-user' ||
              errorCode === 'auth/cancelled-popup-request'
            ) {
              return;
            }
            const friendlyMessage =
              GOOGLE_LOGIN_ERROR_MESSAGES[errorCode] ?? DEFAULT_GOOGLE_LOGIN_ERROR_MESSAGE;
            setLoginError(`${friendlyMessage} (${errorCode})`);
          });
        }}
        className="flex h-10 items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:cursor-pointer"
      >
        <GoogleLogo />
        Sign in with Google
      </Button>
    </div>
  );
};

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.4673-.806 5.9577-2.1805l-2.9087-2.2581c-.8059.5409-1.8368.8606-3.049.8606-2.3445 0-4.3287-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71c-.18-.5409-.2822-1.1182-.2822-1.71s.1023-1.1691.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z"
    />
    <path
      fill="#EA4335"
      d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6713 5.1627 6.6555 3.5795 9 3.5795z"
    />
  </svg>
);
