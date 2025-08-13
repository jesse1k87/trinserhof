import React from 'react';
import { User, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Button, Input } from '@bookings/ui';
import { logIn } from '@bookings/database';

export const LoginForm = () => {
  const auth = getAuth();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <div className="flex flex-col gap-6">
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
        onClick={() => logIn()}
        className="p-3 rounded-full hover:cursor-pointer"
      >
        Login with Google
      </Button>
    </div>
  );
};
