import React from 'react';
import { User, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button, Error, Input } from '@trinserhof/ui';
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
  const auth = getAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 w-80">
      {loginError && <Error message={loginError} />}
      <div className="flex flex-col gap-2">
        <Input
          placeholder="E-mail address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          border={true}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          border={true}
        />

        <Button
          variant="outline"
          onClick={() => {
            signInWithEmailAndPassword(auth, email, password)
              .then((userCredential) => {
                console.log(userCredential);
              })
              .catch((error) => {
                console.error(error.code);
                console.error(error.message);
              });
          }}
          className="p-3 rounded-full hover:cursor-pointer"
        >
          Login
        </Button>
      </div>

      <div className="flex items-center gap-2 text-gray-400">
        <hr className="border w-full border-gray-200" />
        <div>or</div>
        <hr className="border w-full border-gray-200" />
      </div>

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
            setLoginError(
              GOOGLE_LOGIN_ERROR_MESSAGES[errorCode] ?? DEFAULT_GOOGLE_LOGIN_ERROR_MESSAGE,
            );
          });
        }}
        className="p-3 rounded-full hover:cursor-pointer"
      >
        Login with Google
      </Button>
    </div>
  );
};
