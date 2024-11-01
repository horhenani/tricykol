# Authentication | React Native Firebase
Edit Page

!Icon

Installation and getting started with Authentication.

[](#installation)Installation
-----------------------------

This module requires that the `@react-native-firebase/app` module is already setup and installed. To install the "app" module, view the Getting Started documentation.

```
# Install & setup the app module
yarn add @react-native-firebase/app

# Install the authentication module
yarn add @react-native-firebase/auth

# If you're developing your app using iOS, run this command
cd ios/ && pod install

```


If you're using an older version of React Native without autolinking support, or wish to integrate into an existing project, you can follow the manual installation steps for iOS and Android.

[](#what-does-it-do)What does it do
-----------------------------------

Firebase Authentication provides backend services & easy-to-use SDKs to authenticate users to your app. It supports authentication using passwords, phone numbers, popular federated identity providers like Google, Facebook and Twitter, and more.

Firebase Authentication integrates tightly with other Firebase services, and it leverages industry standards like OAuth 2.0 and OpenID Connect, so it can be easily integrated with your custom backend.

[](#usage)Usage
---------------

### [](#listening-to-authentication-state)Listening to authentication state

In most scenarios using Authentication, you will want to know whether your users are currently signed-in or signed-out of your application. The module provides a method called `onAuthStateChanged` which allows you to subscribe to the users current authentication state, and receive an event whenever that state changes.

It is important to remember the `onAuthStateChanged` listener is asynchronous and will trigger an initial state once a connection with Firebase has been established. Therefore it is important to setup an "initializing" state which blocks render of our main application whilst the connection is established:

```
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import auth from '@react-native-firebase/auth';

function App() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  if (!user) {
    return (
      <View>
        <Text>Login</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>Welcome {user.email}</Text>
    </View>
  );
}

```


If the `user` returned within the handler is `null` we assume the user is currently signed-out, otherwise they are signed-in and a `User` interface is returned.

The `onAuthStateChanged` method also returns an unsubscriber function which allows us to stop listening for events whenever the hook is no longer in use.

### [](#persisting-authentication-state)Persisting authentication state

On web based applications, the Firebase Web SDK takes advantage of features such as cookies and local storage to persist the users authenticated state across sessions. The native Firebase SDKs also provide this functionality using device native SDKs, ensuring that a users previous authentication state between app sessions is persisted.

The user is able to clear their state by deleting the apps data/cache from the device settings.

### [](#anonymous-sign-in)Anonymous sign-in

Some applications don't require authentication, which make it tricky to identify what users are doing throughout your app. If connecting with external APIs, it is also useful to add an extra layer of security by ensuring the users request is from the app. This can be achieved with the `signInAnonymously` method, which creates a new anonymous user which is persisted, allowing you to integrate with other services such as Analytics by providing a user ID.

Ensure the "Anonymous" sign-in provider is enabled on the Firebase Console.

```
import auth from '@react-native-firebase/auth';

auth()
  .signInAnonymously()
  .then(() => {
    console.log('User signed in anonymously');
  })
  .catch(error => {
    if (error.code === 'auth/operation-not-allowed') {
      console.log('Enable anonymous in your firebase console.');
    }

    console.error(error);
  });

```


Once successfully signed in, any `onAuthStateChanged` listeners will trigger an event with the `User` details.

In case any errors occur, the module provides support for identifying what specifically went wrong by attaching a code to the error. For a full list of error codes available, view the Firebase documentation.

### [](#emailpassword-sign-in)Email/Password sign-in

Email/password sign in is a common method for user sign in on applications. This requires the user to provide an email address and secure password. Users can both register and sign in using a method called `createUserWithEmailAndPassword` or sign in to an existing account with `signInWithEmailAndPassword`.

Ensure the "Email/Password" sign-in provider is enabled on the Firebase Console.

The `createUserWithEmailAndPassword` performs two operations; first creating the user if they do not already exist, and then signing them in.

```
import auth from '@react-native-firebase/auth';

auth()
  .createUserWithEmailAndPassword('jane.doe@example.com', 'SuperSecretPassword!')
  .then(() => {
    console.log('User account created & signed in!');
  })
  .catch(error => {
    if (error.code === 'auth/email-already-in-use') {
      console.log('That email address is already in use!');
    }

    if (error.code === 'auth/invalid-email') {
      console.log('That email address is invalid!');
    }

    console.error(error);
  });

```


Once successfully created and/or signed in, any `onAuthStateChanged` listeners will trigger an event with the `User` details.

In case any errors occur, the module provides support for identifying what specifically went wrong by attaching a code to the error. For a full list of error codes available, view the Firebase documentation.

### [](#authenticate-with-backend-server)Authenticate with backend server

The user's token should be used for authentication with your backend systems. The token is fetched with the getIdToken method. As mentioned in the Firebase documentation, the uid should not be used for authentication.

### [](#signing-out)Signing out

If you'd like to sign the user out of their current authentication state, call the `signOut` method:

```
import auth from '@react-native-firebase/auth';

auth()
  .signOut()
  .then(() => console.log('User signed out!'));

```


Once successfully signed out, any `onAuthStateChanged` listeners will trigger an event with the `user` parameter being a `null` value.

Additionally, using `GoogleSignin.revokeAccess()` forgets the user. This means that the next time someone signs in, they will see the account selection popup. If you don't use this function, the last account will be automatically used without showing the account selection popup.

### [](#other-sign-in-methods)Other sign-in methods

Firebase also supports authenticating with external provides. To learn more, view the documentation for your authentication method:

*   Apple Sign-In.
*   Facebook Sign-In.
*   Twitter Sign-In.
*   Google Sign-In.
*   Microsoft Sign-In.
*   Phone Number Sign-In.
