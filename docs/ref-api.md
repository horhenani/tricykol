# auth | React Native Firebase
Edit Page

The Firebase Authentication service is available for the default app or a given app.

##### [](#)Example 1

Get the auth instance for the **default app**:

```
const authForDefaultApp = firebase.auth();

```


##### [](#)Example 2

Get the auth instance for a **secondary app**:

```
const otherApp = firebase.app('otherApp');
const authForOtherApp = firebase.auth(otherApp);

```


TODO @salakar missing updateCurrentUser

### [](#properties)Properties

*   currentUser
*   languageCode
*   settings
*   tenantId

Returns the currently signed-in user (or null if no user signed in). See the User interface documentation for detailed usage.

```
currentUser: User | null;
```


Returns the current language code. Sets the language code on the auth instance. This is to match Firebase JS SDK behavior. Please use the `setLanguageCode` method for setting the language code.

Returns the current `AuthSettings`.

Returns the current tenant Id or null if it has never been set

### [](#methods)Methods

*   applyActionCode
*   checkActionCode
*   confirmPasswordReset
*   createUserWithEmailAndPassword
*   fetchSignInMethodsForEmail
*   getCustomAuthDomain
*   getMultiFactorResolver
*   isSignInWithEmailLink
*   multiFactor
*   onAuthStateChanged
*   onIdTokenChanged
*   onUserChanged
*   revokeToken
*   sendPasswordResetEmail
*   sendSignInLinkToEmail
*   setLanguageCode
*   setTenantId
*   signInAnonymously
*   signInWithCredential
*   signInWithCustomToken
*   signInWithEmailAndPassword
*   signInWithEmailLink
*   signInWithPhoneNumber
*   signInWithPopup
*   signInWithProvider
*   signInWithRedirect
*   signOut
*   useEmulator
*   useUserAccessGroup
*   verifyPasswordResetCode
*   verifyPhoneNumber
*   verifyPhoneNumberForMultiFactor
*   verifyPhoneNumberWithMultiFactorInfo

Applies a verification code sent to the user by email or other out-of-band mechanism.

```
applyActionCode(code: string): Promise<void>;
```


Checks a verification code sent to the user by email or other out-of-band mechanism.

Completes the password reset process with the confirmation code and new password, via `auth#sendPasswordResetEmail`.

```
confirmPasswordReset(code: string, newPassword: string): Promise<void>;
```


#### [](#createUserWithEmailAndPassword)createUserWithEmailAndPassword

</>

Creates a new user with an email and password.

#### [](#fetchSignInMethodsForEmail)fetchSignInMethodsForEmail

</>

Returns a list of authentication methods that can be used to sign in a given user (identified by its main email address).

```
fetchSignInMethodsForEmail(email: string): Promise<string[]>;
```


Returns the custom auth domain for the auth instance.

```
getCustomAuthDomain(): Promise<string>;
```


#### [](#getMultiFactorResolver)getMultiFactorResolver

</>

Provides a MultiFactorResolver suitable for completion of a multi-factor flow.

Returns whether the user signed in with a given email link.

```
isSignInWithEmailLink(emailLink: string): boolean;
```


The MultiFactorUser corresponding to the user.

Listen for changes in the users auth state (logging in and out). This method returns a unsubscribe function to stop listening to events. Always ensure you unsubscribe from the listener when no longer needed to prevent updates to components no longer in use.

Listen for changes in ID token. ID token can be verified (if desired) using the admin SDK or a 3rd party JWT library This method returns a unsubscribe function to stop listening to events. Always ensure you unsubscribe from the listener when no longer needed to prevent updates to components no longer in use.

Adds a listener to observe changes to the User object. This is a superset of everything from `auth#onAuthStateChanged`, `auth#onIdTokenChanged` and user changes. The goal of this method is to provide easier listening to all user changes, such as when credentials are linked and unlinked, without manually having to call `User#reload`.

Revokes a user's Sign in with Apple token.

```
revokeToken(authorizationCode: string): Promise<void>;
```


#### [](#sendPasswordResetEmail)sendPasswordResetEmail

</>

Sends a password reset email to the given email address. Unlike the web SDK, the email will contain a password reset link rather than a code.

Sends a sign in link to the user.

Sets the language code.

```
setLanguageCode(languageCode: string | null): Promise<void>;
```


Sets the tenant id.

```
setTenantId(tenantId: string): Promise<void>;
```


Sign in a user anonymously. If the user has already signed in, that user will be returned.

Signs the user in with a generated credential.

Signs a user in with a custom token.

#### [](#signInWithEmailAndPassword)signInWithEmailAndPassword

</>

Signs a user in with an email and password.

Signs the user in with an email link.

Signs in the user using their phone number.

Signs the user in with a specified provider. This is a web-compatible API along with signInWithRedirect. They both share the same call to the underlying native SDK signInWithProvider method.

Signs the user in with a federated OAuth provider supported by Firebase (Microsoft, Yahoo).

Signs the user in with a specified provider. This is a web-compatible API along with signInWithPopup. They both share the same call to the underlying native SDK signInWithProvider method.

Modify this Auth instance to communicate with the Firebase Auth emulator. This must be called synchronously immediately following the first call to firebase.auth(). Do not use with production credentials as emulator traffic is not encrypted.

```
useEmulator(url: string): void;
```


Switch userAccessGroup and current user to the given accessGroup and the user stored in it. Sign in a user with any sign in method, and the same current user is available in all apps in the access group.

```
useUserAccessGroup(userAccessGroup: string): Promise<null>;
```


#### [](#verifyPasswordResetCode)verifyPasswordResetCode

</>

Checks a password reset code sent to the user by email or other out-of-band mechanism. TODO salakar: confirm return behavior (Returns the user's email address if valid.)

```
verifyPasswordResetCode(code: string): Promise<string>;
```


Returns a PhoneAuthListener to listen to phone verification events, on the final completion event a PhoneAuthCredential can be generated for authentication purposes.

```
verifyPhoneNumber(phoneNumber: string, autoVerifyTimeoutOrForceResend?: number | boolean, forceResend?: undefined | false | true): PhoneAuthListener;
```


#### [](#verifyPhoneNumberForMultiFactor)verifyPhoneNumberForMultiFactor

</>

Send an SMS to the user for verification of second factor

#### [](#verifyPhoneNumberWithMultiFactorInfo)verifyPhoneNumberWithMultiFactorInfo

</>

Obtain a verification id to complete the multi-factor sign-in flow.

### [](#statics)Statics

*   AppleAuthProvider
*   EmailAuthProvider
*   FacebookAuthProvider
*   GithubAuthProvider
*   GoogleAuthProvider
*   OAuthProvider
*   OIDCAuthProvider
*   PhoneAuthProvider
*   PhoneAuthState
*   PhoneMultiFactorGenerator
*   TwitterAuthProvider
*   getMultiFactorResolver

Apple auth provider implementation. Currently this is iOS only.

Email and password auth provider implementation.

Facebook auth provider implementation.

Github auth provider implementation.

Google auth provider implementation.

Custom OAuth auth provider implementation.

Custom Open ID connect auth provider implementation.

Phone auth provider implementation.

A PhoneAuthState interface.

#### [](#PhoneMultiFactorGenerator)PhoneMultiFactorGenerator

</>

A PhoneMultiFactorGenerator interface.

Twitter auth provider implementation.

#### [](#getMultiFactorResolver)getMultiFactorResolver

</>

```
auth.getMultiFactorResolver: getMultiFactorResolver;
```





User
Represents a user's profile information in your Firebase project's user database. It also contains helper methods to change or retrieve profile information, as well as to manage that user's authentication state.

Example 1
Subscribing to the users authentication state.

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('User email: ', user.email);
  }
});
Example 2
const user = firebase.auth().currentUser;

if (user) {
 console.log('User email: ', user.email);
}





getIdToken
Returns the users authentication token.

getIdToken(forceRefresh?: undefined | false | true): Promise<string>;
getIdTokenResult
Returns a firebase.auth.IdTokenResult object which contains the ID token JWT string and other helper properties for getting different data associated with the token as well as all the decoded payload claims.

getIdTokenResult(forceRefresh?: undefined | false | true): Promise<IdTokenResult>;

