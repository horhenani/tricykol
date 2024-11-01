# SecureStore - Expo Documentation
!Expo SecureStore iconExpo SecureStore
------------------------------------------------------------------------------------------------------------

A library that provides a way to encrypt and securely store key-value pairs locally on the device.

* * *

`expo-secure-store` provides a way to encrypt and securely store key–value pairs locally on the device. Each Expo project has a separate storage system and has no access to the storage of other Expo projects.

Size limit for a value is 2048 bytes. An attempt to store larger values may fail. Currently, we print a warning when the limit is reached, however, in a future SDK version an error might be thrown.

The `requireAuthentication` option is not supported in Expo Go when biometric authentication is available due to a missing `NSFaceIDUsageDescription` key.

> This API is not compatible with devices running Android 5 or lower.

Installation
-----------------------------

`-` `npx expo install expo-secure-store`

If you are installing this in an existing React Native app, start by installing `expo` in your project. Then, follow the additional instructions as mentioned by the library's README under "Installation in bare React Native projects" section.

Configuration in app.json/app.config.js
-------------------------------------------------------------------------------

You can configure `expo-secure-store` using its built-in config plugin if you use config plugins in your project (EAS Build or `npx expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

### Example app.json with config plugin

```
{
  "expo": {
    "plugins": [
      [
        "expo-secure-store",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
        }
      ]
    ]
  }
}

```


### Configurable properties



* Name: faceIDPermission
  * Default: "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
  * Description: Only for: iOSA string to set the NSFaceIDUsageDescription permission message.


Are you using this library in a bare React Native app?[](#are-you-using-this-library-in-a)

Add `NSFaceIDUsageDescription` key to Info.plist:

```
<key>NSCameraUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the camera</string>

```


Platform value storage
-------------------------------------------------

### Android

On Android, values are stored in `SharedPreferences`, encrypted with Android's Keystore system.

### iOS

> For iOS standalone apps, data stored with `expo-secure-store` can persist across app installs.

On iOS, values are stored using the keychain services as `kSecClassGenericPassword`. iOS has the additional option of being able to set the value's `kSecAttrAccessible` attribute, which controls when the value is available to be fetched.

#### Exempting encryption prompt

Apple App Store Connect prompts you to select the type of encryption algorithm your app implements. This is known as Export Compliance Information. It is asked when publishing the app or submitting for TestFlight.

When using `expo-secure-store`, you can set the `ios.config.usesNonExemptEncryption` property to `false` in the app config:

```
{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
      %%placeholder-start%%... %%placeholder-end%%
    }
  }
}

```


Setting this property automatically handles the compliance information prompt.

Usage
---------------

```
import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';

async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

async function getValueFor(key) {
  let result = await SecureStore.getItemAsync(key);
  if (result) {
    alert("🔐 Here's your value 🔐 \n" + result);
  } else {
    alert('No values stored under that key.');
  }
}

export default function App() {
  const [key, onChangeKey] = useState('Your key here');
  const [value, onChangeValue] = useState('Your value here');

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>Save an item, and grab it later!</Text>
      {%%placeholder-start%%Add some TextInput components... %%placeholder-end%%}

      <TextInput
        style={styles.textInput}
        clearTextOnFocus
        onChangeText={text => onChangeKey(text)}
        value={key}
      />
      <TextInput
        style={styles.textInput}
        clearTextOnFocus
        onChangeText={text => onChangeValue(text)}
        value={value}
      />
      {}
      <Button
        title="Save this key/value pair"
        onPress={() => {
          save(key, value);
          onChangeKey('Your key here');
          onChangeValue('Your value here');
        }}
      />
      <Text style={styles.paragraph}>🔐 Enter your key 🔐</Text>
      <TextInput
        style={styles.textInput}
        onSubmitEditing={event => {
          getValueFor(event.nativeEvent.text);
        }}
        placeholder="Enter the key for the value you want to get"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 10,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    marginTop: 34,
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    height: 35,
    borderColor: 'gray',
    borderWidth: 0.5,
    padding: 4,
  },
});

```


API
-----------

```
import * as SecureStore from 'expo-secure-store';

```


Constants
-----------------------

### `SecureStore.AFTER_FIRST_UNLOCK`

Type: `KeychainAccessibilityConstant`

The data in the keychain item cannot be accessed after a restart until the device has been unlocked once by the user. This may be useful if you need to access the item when the phone is locked.

### `SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`

Type: `KeychainAccessibilityConstant`

Similar to `AFTER_FIRST_UNLOCK`, except the entry is not migrated to a new device when restoring from a backup.

> Deprecated Use an accessibility level that provides some user protection, such as `AFTER_FIRST_UNLOCK`.

### `SecureStore.ALWAYS`

Type: `KeychainAccessibilityConstant`

The data in the keychain item can always be accessed regardless of whether the device is locked. This is the least secure option.

> Deprecated Use an accessibility level that provides some user protection, such as `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`.

### `SecureStore.ALWAYS_THIS_DEVICE_ONLY`

Type: `KeychainAccessibilityConstant`

Similar to `ALWAYS`, except the entry is not migrated to a new device when restoring from a backup.

### `SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`

Type: `KeychainAccessibilityConstant`

Similar to `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, except the user must have set a passcode in order to store an entry. If the user removes their passcode, the entry will be deleted.

### `SecureStore.WHEN_UNLOCKED`

Type: `KeychainAccessibilityConstant`

The data in the keychain item can be accessed only while the device is unlocked by the user.

### `SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY`

Type: `KeychainAccessibilityConstant`

Similar to `WHEN_UNLOCKED`, except the entry is not migrated to a new device when restoring from a backup.

Methods
-------------------

### `SecureStore.canUseBiometricAuthentication()`

Checks if the value can be saved with `requireAuthentication` option enabled.

`true` if the device supports biometric authentication and the enrolled method is sufficiently secure. Otherwise, returns `false`.

### `SecureStore.deleteItemAsync(key, options)`


|Parameter        |Type              |Description                                         |
|-----------------|------------------|----------------------------------------------------|
|key              |string            |The key that was used to store the associated value.|
|options(optional)|SecureStoreOptions|An SecureStoreOptions object.Default:{}             |


Delete the value associated with the provided key.

A promise that rejects if the value can't be deleted.

### `SecureStore.getItem(key, options)`


|Parameter        |Type              |Description                                         |
|-----------------|------------------|----------------------------------------------------|
|key              |string            |The key that was used to store the associated value.|
|options(optional)|SecureStoreOptions|An SecureStoreOptions object.Default:{}             |


Synchronously reads the stored value associated with the provided key.

> Note: This function blocks the JavaScript thread, so the application may not be interactive when reading a value with `requireAuthentication` option set to `true` until the user authenticates.

Previously stored value. It resolves with `null` if there is no entry for the given key or if the key has been invalidated.

### `SecureStore.getItemAsync(key, options)`


|Parameter        |Type              |Description                                         |
|-----------------|------------------|----------------------------------------------------|
|key              |string            |The key that was used to store the associated value.|
|options(optional)|SecureStoreOptions|An SecureStoreOptions object.Default:{}             |


Reads the stored value associated with the provided key.

A promise that resolves to the previously stored value. It resolves with `null` if there is no entry for the given key or if the key has been invalidated. It rejects if an error occurs while retrieving the value.

> Keys are invalidated by the system when biometrics change, such as adding a new fingerprint or changing the face profile used for face recognition. After a key has been invalidated, it becomes impossible to read its value. This only applies to values stored with `requireAuthentication` set to `true`.

### `SecureStore.isAvailableAsync()`

Returns whether the SecureStore API is enabled on the current device. This does not check the app permissions.

Promise which fulfils witch `boolean`, indicating whether the SecureStore API is available on the current device. Currently, this resolves `true` on Android and iOS only.

### `SecureStore.setItem(key, value, options)`



* Parameter: key
  * Type: string
  * Description: The key to associate with the stored value. Keys may contain alphanumeric characters, ., -, and _.
* Parameter: value
  * Type: string
  * Description: The value to store. Size limit is 2048 bytes.
* Parameter: options(optional)
  * Type: SecureStoreOptions
  * Description: An SecureStoreOptions object.Default:{}


Stores a key–value pair synchronously.

> Note: This function blocks the JavaScript thread, so the application may not be interactive when the `requireAuthentication` option is set to `true` until the user authenticates.

### `SecureStore.setItemAsync(key, value, options)`



* Parameter: key
  * Type: string
  * Description: The key to associate with the stored value. Keys may contain alphanumeric characters, ., -, and _.
* Parameter: value
  * Type: string
  * Description: The value to store. Size limit is 2048 bytes.
* Parameter: options(optional)
  * Type: SecureStoreOptions
  * Description: An SecureStoreOptions object.Default:{}


Stores a key–value pair.

A promise that rejects if value cannot be stored on the device.

Types
---------------

### `SecureStoreOptions`



* Name: authenticationPrompt(optional)
  * Type: string
  * Description: Custom message displayed to the user while requireAuthentication option is turned on.
* Name: keychainAccessible(optional)
  * Type: KeychainAccessibilityConstant
  * Description: Only for: iOSSpecifies when the stored entry is accessible, using iOS's kSecAttrAccessible property.Default:SecureStore.WHEN_UNLOCKEDSee: Apple's documentation on keychain item accessibility.
* Name: keychainService(optional)
  * Type: string
  * Description: Android: Equivalent of the public/private key pair Alias.iOS: The item's service, equivalent to kSecAttrService.If the item is set with the keychainService option, it will be required to later fetch the value.
* Name: requireAuthentication(optional)
  * Type: boolean
  * Description: Option responsible for enabling the usage of the user authentication methods available on the device whileaccessing data stored in SecureStore.Android: Equivalent to setUserAuthenticationRequired(true)(requires API 23).iOS: Equivalent to biometryCurrentSet.Complete functionality is unlocked only with a freshly generated key - this would not work in tandem with the keychainServicevalue used for the others non-authenticated operations.This option works slightly differently across platforms: On iOS, the user is prompted to authenticate only when reading or updating an existing value (not when creating a new one).On Android, user authentication is required for all operations.Warning: This option is not supported in Expo Go when biometric authentication is available due to a missing NSFaceIDUsageDescription.In release builds or when using continuous native generation, make sure to use the expo-secure-store config plugin.

