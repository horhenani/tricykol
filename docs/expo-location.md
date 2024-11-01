# Location - Expo Documentation
!Expo Location iconExpo Location
--------------------------------------------------------------------------------------------------

A library that provides access to reading geolocation information, polling current location or subscribing location update events from the device.

* * *

`expo-location` allows reading geolocation information from the device. Your app can poll for the current location or subscribe to location update events.

Installation
-----------------------------

`-` `npx expo install expo-location`

If you are installing this in an existing React Native app, start by installing `expo` in your project. Then, follow the additional instructions as mentioned by the library's README under "Installation in bare React Native projects" section.

Configuration in app.json/app.config.js
-------------------------------------------------------------------------------

You can configure `expo-location` using its built-in config plugin if you use config plugins in your project (EAS Build or `npx expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

### Example app.json with config plugin

```
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ]
  }
}

```


### Configurable properties



* Name: locationAlwaysAndWhenInUsePermission
  * Default: "Allow $(PRODUCT_NAME) to use your location"
  * Description: Only for: iOSA string to set the NSLocationAlwaysAndWhenInUseUsageDescription permission message.
* Name: locationAlwaysPermission
  * Default: "Allow $(PRODUCT_NAME) to use your location"
  * Description: Only for: iOSA string to set the NSLocationAlwaysUsageDescription permission message.
* Name: locationWhenInUsePermission
  * Default: "Allow $(PRODUCT_NAME) to use your location"
  * Description: Only for: iOSA string to set the NSLocationWhenInUseUsageDescription permission message.
* Name: isIosBackgroundLocationEnabled
  * Default: false
  * Description: Only for: iOSA boolean to enable location in the UIBackgroundModes in Info.plist.
* Name: isAndroidBackgroundLocationEnabled
  * Default: false
  * Description: Only for: AndroidA boolean to enable the ACCESS_BACKGROUND_LOCATION permission.
* Name: isAndroidForegroundServiceEnabled
  * Default: -
  * Description: Only for: AndroidA boolean to enable the FOREGROUND_SERVICE permission and FOREGROUND_SERVICE_LOCATION. Defaults to true if isAndroidBackgroundLocationEnabled is true, otherwise false.


Are you using this library in a bare React Native app?[](#are-you-using-this-library-in-a)

### Background Location methods

> Warning: Background location tracking support is provided as-is and is not guaranteed to work in all scenarios. We currently are not prioritizing resources to improve it, but we hope to in the future. You may want to use `react-native-background-geolocation` instead — it requires purchasing a license and is a well-maintained and supported library that includes a config plugin.

To use Background Location methods, the following requirements apply:

*   Location permissions must be granted. On iOS it must be granted with `Always` option.
*   Background location task must be defined in the top-level scope, using `TaskManager.defineTask`.
*   `"location"` background mode must be specified in Info.plist file. See background tasks configuration guide.

### Geofencing methods

To use Geofencing methods, the following requirements apply:

*   Location permissions must be granted. On iOS it must be granted with `Always` option.
*   The Geofencing task must be defined in the top-level scope, using `TaskManager.defineTask`.
*   On iOS, there is a limit of 20 `regions` that can be simultaneously monitored.

Usage
---------------

If you're using the Android Emulator or iOS Simulator, ensure that Location is enabled.

```
import { useState, useEffect } from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';
%%placeholder-start%%%%placeholder-end%%import * as Device from 'expo-device';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      %%placeholder-start%%%%placeholder-end%%if (Platform.OS === 'android' && !Device.isDevice) {
        setErrorMsg(
          'Oops, this will not work on Snack in an Android Emulator. Try it on your device!'
        );
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
  },
});

```


Enable Emulator Location
-----------------------------------------------------

### Android Emulator

Open Android Studio, and launch the Android Emulator. Inside it, go to Settings > Location and enable Use location.

If you don't receive the locations in the emulator, you may have to turn off the Improve Location Accuracy setting. This will turn off Wi-Fi location and only use GPS. Then you can manipulate the location with GPS data through the emulator.

For Android 12 and higher, go to Settings > Location > Location Services > Google Location Accuracy, and turn off Improve Location Accuracy. For Android 11 and lower, go to Settings > Location > Advanced > Google Location Accuracy, and turn off Google Location Accuracy.

### iOS Simulator

With Simulator open, go to Features > Location and choose any option besides None.

API
-----------

```
import * as Location from 'expo-location';

```


Hooks
---------------

### `useBackgroundPermissions(options)`


|Parameter        |Type                         |
|-----------------|-----------------------------|
|options(optional)|PermissionHookOptions<object>|


Check or request permissions for the background location. This uses both `requestBackgroundPermissionsAsync` and `getBackgroundPermissionsAsync` to interact with the permissions.

`null | [PermissionResponse, RequestPermissionMethod<PermissionResponse>, GetPermissionMethod<PermissionResponse>]`

Example

```
const [status, requestPermission] = Location.useBackgroundPermissions();

```


### `useForegroundPermissions(options)`


|Parameter        |Type                         |
|-----------------|-----------------------------|
|options(optional)|PermissionHookOptions<object>|


Check or request permissions for the foreground location. This uses both `requestForegroundPermissionsAsync` and `getForegroundPermissionsAsync` to interact with the permissions.

`null | [LocationPermissionResponse, RequestPermissionMethod<LocationPermissionResponse>, GetPermissionMethod<LocationPermissionResponse>]`

Example

```
const [status, requestPermission] = Location.useForegroundPermissions();

```


Methods
-------------------

### `Location.enableNetworkProviderAsync()`

Asks the user to turn on high accuracy location mode which enables network provider that uses Google Play services to improve location accuracy and location-based services.

A promise resolving as soon as the user accepts the dialog. Rejects if denied.

### `Location.geocodeAsync(address, options)`



* Parameter: address
  * Type: string
  * Description: A string representing address, eg. "Baker Street London".
* Parameter: options(optional)
  * Type: LocationGeocodingOptions
  * Description: -


Geocode an address string to latitude-longitude location.

> Note: Using the Geocoding web api is no longer supported. Use Place Autocomplete instead.

> Note: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error, so they have to be managed properly. It's also discouraged to use geocoding while the app is in the background and its results won't be shown to the user immediately.

> On Android, you must request a location permission (`Permissions.LOCATION`) from the user before geocoding can be used.

A promise which fulfills with an array (in most cases its size is 1) of `LocationGeocodedLocation` objects.

### `Location.getBackgroundPermissionsAsync()`

Checks user's permissions for accessing location while the app is in the background.

A promise that fulfills with an object of type PermissionResponse.

### `Location.getCurrentPositionAsync(options)`


|Parameter        |Type           |
|-----------------|---------------|
|options(optional)|LocationOptions|


Requests for one-time delivery of the user's current location. Depending on given `accuracy` option it may take some time to resolve, especially when you're inside a building.

> Note: Calling it causes the location manager to obtain a location fix which may take several seconds. Consider using `Location.getLastKnownPositionAsync` if you expect to get a quick response and high accuracy is not required.

A promise which fulfills with an object of type `LocationObject`.

### `Location.getForegroundPermissionsAsync()`

Checks user's permissions for accessing location while the app is in the foreground.

A promise that fulfills with an object of type PermissionResponse.

### `Location.getHeadingAsync()`

Gets the current heading information from the device. To simplify, it calls `watchHeadingAsync` and waits for a couple of updates, and then returns the one that is accurate enough.

A promise which fulfills with an object of type LocationHeadingObject.

### `Location.getLastKnownPositionAsync(options)`


|Parameter        |Type                    |
|-----------------|------------------------|
|options(optional)|LocationLastKnownOptions|


Gets the last known position of the device or `null` if it's not available or doesn't match given requirements such as maximum age or required accuracy. It's considered to be faster than `getCurrentPositionAsync` as it doesn't request for the current location, but keep in mind the returned location may not be up-to-date.

A promise which fulfills with an object of type LocationObject or `null` if it's not available or doesn't match given requirements such as maximum age or required accuracy.

### `Location.getPermissionsAsync()`

Checks user's permissions for accessing location.

A promise that fulfills with an object of type LocationPermissionResponse.

### `Location.getProviderStatusAsync()`

Check status of location providers.

A promise which fulfills with an object of type LocationProviderStatus.

### `Location.hasServicesEnabledAsync()`

Checks whether location services are enabled by the user.

A promise which fulfills to `true` if location services are enabled on the device, or `false` if not.

### `Location.hasStartedGeofencingAsync(taskName)`


|Parameter|Type  |Description                          |
|---------|------|-------------------------------------|
|taskName |string|Name of the geofencing task to check.|


A promise which fulfills with boolean value indicating whether the geofencing task is started or not.

### `Location.hasStartedLocationUpdatesAsync(taskName)`


|Parameter|Type  |Description                        |
|---------|------|-----------------------------------|
|taskName |string|Name of the location task to check.|


A promise which fulfills with boolean value indicating whether the location task is started or not.

### `Location.installWebGeolocationPolyfill()`

Polyfills `navigator.geolocation` for interop with the core React Native and Web API approach to geolocation.

### `Location.requestBackgroundPermissionsAsync()`

Asks the user to grant permissions for location while the app is in the background. On Android 11 or higher: this method will open the system settings page - before that happens you should explain to the user why your application needs background location permission. For example, you can use `Modal` component from `react-native` to do that.

> Note: Foreground permissions should be granted before asking for the background permissions (your app can't obtain background permission without foreground permission).

A promise that fulfills with an object of type PermissionResponse.

### `Location.requestForegroundPermissionsAsync()`

Asks the user to grant permissions for location while the app is in the foreground.

A promise that fulfills with an object of type PermissionResponse.

### `Location.requestPermissionsAsync()`

Asks the user to grant permissions for location.

A promise that fulfills with an object of type LocationPermissionResponse.

### `Location.reverseGeocodeAsync(location, options)`



* Parameter: location
  * Type: Pick<LocationGeocodedLocation, 'latitude' | 'longitude'>
  * Description: An object representing a location.
* Parameter: options(optional)
  * Type: LocationGeocodingOptions
  * Description: -


Reverse geocode a location to postal address.

> Note: Using the Geocoding web api is no longer supported. Use Place Autocomplete instead.

> Note: Geocoding is resource consuming and has to be used reasonably. Creating too many requests at a time can result in an error, so they have to be managed properly. It's also discouraged to use geocoding while the app is in the background and its results won't be shown to the user immediately.

> On Android, you must request a location permission (`Permissions.LOCATION`) from the user before geocoding can be used.

A promise which fulfills with an array (in most cases its size is 1) of `LocationGeocodedAddress` objects.

> Deprecated The Geocoding web api is no longer available from SDK 49 onwards. Use Place Autocomplete instead.

### `Location.setGoogleApiKey(_apiKey)`



* Parameter: _apiKey
  * Type: string
  * Description: Google API key obtained from Google API Console. This API key must have Geocoding APIenabled, otherwise your geocoding requests will be denied.


  

### `Location.startGeofencingAsync(taskName, regions)`



* Parameter: taskName
  * Type: string
  * Description: Name of the task that will be called when the device enters or exits from specified regions.
* Parameter: regions(optional)
  * Type: LocationRegion[]
  * Description: Array of region objects to be geofenced.Default:[]


Starts geofencing for given regions. When the new event comes, the task with specified name will be called with the region that the device enter to or exit from. If you want to add or remove regions from already running geofencing task, you can just call `startGeofencingAsync` again with the new array of regions.

#### Task parameters

Geofencing task will be receiving following data:

*   `eventType` - Indicates the reason for calling the task, which can be triggered by entering or exiting the region. See GeofencingEventType.
*   `region` - Object containing details about updated region. See LocationRegion for more details.

A promise resolving as soon as the task is registered.

Example

```
import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

 TaskManager.defineTask(YOUR_TASK_NAME, ({ data: { eventType, region }, error }) => {
  if (error) {
    // check `error.message` for more details.
    return;
  }
  if (eventType === GeofencingEventType.Enter) {
    console.log("You've entered region:", region);
  } else if (eventType === GeofencingEventType.Exit) {
    console.log("You've left region:", region);
  }
});

```


### `Location.startLocationUpdatesAsync(taskName, options)`


|Parameter        |Type               |Description                                         |
|-----------------|-------------------|----------------------------------------------------|
|taskName         |string             |Name of the task receiving location updates.        |
|options(optional)|LocationTaskOptions|An object of options passed to the location manager.|


Registers for receiving location updates that can also come when the app is in the background.

#### Task parameters

Background location task will be receiving following data:

*   `locations` - An array of the new locations.

```
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask(YOUR_TASK_NAME, ({ data: { locations }, error }) => {
 if (error) {
   // check `error.message` for more details.
   return;
 }
 console.log('Received new locations', locations);
});

```


A promise resolving once the task with location updates is registered.

### `Location.stopGeofencingAsync(taskName)`


|Parameter|Type  |Description                    |
|---------|------|-------------------------------|
|taskName |string|Name of the task to unregister.|


Stops geofencing for specified task. It unregisters the background task so the app will not be receiving any updates, especially in the background.

A promise resolving as soon as the task is unregistered.

### `Location.stopLocationUpdatesAsync(taskName)`


|Parameter|Type  |Description                                  |
|---------|------|---------------------------------------------|
|taskName |string|Name of the background location task to stop.|


Stops geofencing for specified task.

A promise resolving as soon as the task is unregistered.

### `Location.watchHeadingAsync(callback)`



* Parameter: callback
  * Type: LocationHeadingCallback
  * Description: This function is called on each compass update. It receives an object of typeLocationHeadingObject as the first argument.


Subscribe to compass updates from the device.

A promise which fulfills with a `LocationSubscription` object.

### `Location.watchPositionAsync(options, callback)`



* Parameter: options
  * Type: LocationOptions
  * Description: -
* Parameter: callback
  * Type: LocationCallback
  * Description: This function is called on each location update. It receives an object of typeLocationObject as the first argument.


Subscribe to location updates from the device. Please note that updates will only occur while the application is in the foreground. To get location updates while in background you'll need to use Location.startLocationUpdatesAsync.

A promise which fulfills with a `LocationSubscription` object.

Interfaces
-------------------------

### `PermissionResponse`

An object obtained by permissions get and request functions.

PermissionResponse Properties



* Name: canAskAgain
  * Type: boolean
  * Description: Indicates if user can be asked again for specific permission.If not, one should be directed to the Settings appin order to enable/disable the permission.
* Name: expires
  * Type: PermissionExpiration
  * Description: Determines time when the permission expires.
* Name: granted
  * Type: boolean
  * Description: A convenience boolean that indicates if the permission is granted.
* Name: status
  * Type: PermissionStatus
  * Description: Determines the status of the permission.


  

Types
---------------

### `LocationCallback()`

Represents `watchPositionAsync` callback.


|Parameter|Type          |
|---------|--------------|
|location |LocationObject|


### `LocationGeocodedAddress`

Type representing a result of `reverseGeocodeAsync`.



* Name: city
  * Type: string | null
  * Description: City name of the address.
* Name: country
  * Type: string | null
  * Description: Localized country name of the address.
* Name: district
  * Type: string | null
  * Description: Additional city-level information like district name.
* Name: formattedAddress
  * Type: string | null
  * Description: Only for: AndroidComposed string of the address components, for example, "111 8th Avenue, New York, NY".
* Name: isoCountryCode
  * Type: string | null
  * Description: Localized (ISO) country code of the address, if available.
* Name: name
  * Type: string | null
  * Description: The name of the placemark, for example, "Tower Bridge".
* Name: postalCode
  * Type: string | null
  * Description: Postal code of the address.
* Name: region
  * Type: string | null
  * Description: The state or province associated with the address.
* Name: street
  * Type: string | null
  * Description: Street name of the address.
* Name: streetNumber
  * Type: string | null
  * Description: Street number of the address.
* Name: subregion
  * Type: string | null
  * Description: Additional information about administrative area.
* Name: timezone
  * Type: string | null
  * Description: Only for: iOSThe timezone identifier associated with the address.


### `LocationGeocodedLocation`

Type representing a result of `geocodeAsync`.


|Name              |Type  |Description                                                    |
|------------------|------|---------------------------------------------------------------|
|accuracy(optional)|number|The radius of uncertainty for the location, measured in meters.|
|altitude(optional)|number|The altitude in meters above the WGS 84 reference ellipsoid.   |
|latitude          |number|The latitude in degrees.                                       |
|longitude         |number|The longitude in degrees.                                      |


### `LocationGeocodingOptions`

An object of options for forward and reverse geocoding.



* Name: useGoogleMaps(optional)
  * Type: boolean
  * Description: Whether to force using Google Maps API instead of the native implementation.Used by default only on Web platform. Requires providing an API key by setGoogleApiKey.


### `LocationHeadingCallback()`

Represents `watchHeadingAsync` callback.


|Parameter|Type                 |
|---------|---------------------|
|location |LocationHeadingObject|


### `LocationHeadingObject`

Type of the object containing heading details and provided by `watchHeadingAsync` callback.



* Name: accuracy
  * Type: number
  * Description: Level of calibration of compass.3: high accuracy, 2: medium accuracy, 1: low accuracy, 0: noneReference for iOS:3: < 20 degrees uncertainty, 2: < 35 degrees, 1: < 50 degrees, 0: > 50 degrees
* Name: magHeading
  * Type: number
  * Description: Measure of magnetic north in degrees.
* Name: trueHeading
  * Type: number
  * Description: Measure of true north in degrees (needs location permissions, will return -1 if not given).


### `LocationLastKnownOptions`

Type representing options object that can be passed to `getLastKnownPositionAsync`.



* Name: maxAge(optional)
  * Type: number
  * Description: A number of milliseconds after which the last known location starts to be invalid and thusnull is returned.
* Name: requiredAccuracy(optional)
  * Type: number
  * Description: The maximum radius of uncertainty for the location, measured in meters. If the last knownlocation's accuracy radius is bigger (less accurate) then null is returned.


### `LocationObject`

Type representing the location object.



* Name: coords
  * Type: LocationObjectCoords
  * Description: The coordinates of the position.
* Name: mocked(optional)
  * Type: boolean
  * Description: Only for: AndroidWhether the location coordinates is mocked or not.
* Name: timestamp
  * Type: number
  * Description: The time at which this position information was obtained, in milliseconds since epoch.


### `LocationObjectCoords`

Type representing the location GPS related data.



* Name: accuracy
  * Type: number | null
  * Description: The radius of uncertainty for the location, measured in meters. Can be null on Web if it's not available.
* Name: altitude
  * Type: number | null
  * Description: The altitude in meters above the WGS 84 reference ellipsoid. Can be null on Web if it's not available.
* Name: altitudeAccuracy
  * Type: number | null
  * Description: The accuracy of the altitude value, in meters. Can be null on Web if it's not available.
* Name: heading
  * Type: number | null
  * Description: Horizontal direction of travel of this device, measured in degrees starting at due north andcontinuing clockwise around the compass. Thus, north is 0 degrees, east is 90 degrees, south is180 degrees, and so on. Can be null on Web if it's not available.
* Name: latitude
  * Type: number
  * Description: The latitude in degrees.
* Name: longitude
  * Type: number
  * Description: The longitude in degrees.
* Name: speed
  * Type: number | null
  * Description: The instantaneous speed of the device in meters per second. Can be null on Web if it's not available.


### `LocationOptions`

Type representing options argument in `getCurrentPositionAsync`.



* Name: accuracy(optional)
  * Type: Accuracy
  * Description: Location manager accuracy. Pass one of Accuracy enum values.For low-accuracies the implementation can avoid geolocation providersthat consume a significant amount of power (such as GPS).
* Name: distanceInterval(optional)
  * Type: number
  * Description: Receive updates only when the location has changed by at least this distance in meters.Default value may depend on accuracy option.
* Name: mayShowUserSettingsDialog(optional)
  * Type: boolean
  * Description: Only for: AndroidSpecifies whether to ask the user to turn on improved accuracy location modewhich uses Wi-Fi, cell networks and GPS sensor.Default:true
* Name: timeInterval(optional)
  * Type: number
  * Description: Only for: AndroidMinimum time to wait between each update in milliseconds.Default value may depend on accuracy option.


### `LocationPermissionResponse`

`LocationPermissionResponse` extends PermissionResponse type exported by `expo-modules-core` and contains additional platform-specific fields.

Type: `PermissionResponse` extended by:

  


|Name             |Type                            |Description|
|-----------------|--------------------------------|-----------|
|android(optional)|PermissionDetailsLocationAndroid|-          |
|ios(optional)    |PermissionDetailsLocationIOS    |-          |


### `LocationProviderStatus`

Represents the object containing details about location provider.



* Name: backgroundModeEnabled
  * Type: boolean
  * Description: -
* Name: gpsAvailable(optional)
  * Type: boolean
  * Description: Only for: AndroidWhether the GPS provider is available. If true the location data will comefrom GPS, especially for requests with high accuracy.
* Name: locationServicesEnabled
  * Type: boolean
  * Description: Whether location services are enabled. See Location.hasServicesEnabledAsyncfor a more convenient solution to get this value.
* Name: networkAvailable(optional)
  * Type: boolean
  * Description: Only for: AndroidWhether the network provider is available. If true the location data willcome from cellular network, especially for requests with low accuracy.
* Name: passiveAvailable(optional)
  * Type: boolean
  * Description: Only for: AndroidWhether the passive provider is available. If true the location data willbe determined passively.


### `LocationRegion`

Type representing geofencing region object.



* Name: identifier(optional)
  * Type: string
  * Description: The identifier of the region object. Defaults to auto-generated UUID hash.
* Name: latitude
  * Type: number
  * Description: The latitude in degrees of region's center point.
* Name: longitude
  * Type: number
  * Description: The longitude in degrees of region's center point.
* Name: notifyOnEnter(optional)
  * Type: boolean
  * Description: Boolean value whether to call the task if the device enters the region.Default:true
* Name: notifyOnExit(optional)
  * Type: boolean
  * Description: Boolean value whether to call the task if the device exits the region.Default:true
* Name: radius
  * Type: number
  * Description: The radius measured in meters that defines the region's outer boundary.
* Name: state(optional)
  * Type: GeofencingRegionState
  * Description: One of GeofencingRegionState region state. Determines whether thedevice is inside or outside a region.


### `LocationSubscription`

Represents subscription object returned by methods watching for new locations or headings.



* Name: remove
  * Type: () => void
  * Description: Call this function with no arguments to remove this subscription. The callback will no longerbe called for location updates.


### `LocationTaskOptions`

Type representing background location task options.

Type: `LocationOptions` extended by:

  



* Name: activityType(optional)
  * Type: ActivityType
  * Description: Only for: iOSThe type of user activity associated with the location updates.Default:ActivityType.OtherSee: See Apple docs for more details.
* Name: deferredUpdatesDistance(optional)
  * Type: number
  * Description: The distance in meters that must occur between last reported location and the current locationbefore deferred locations are reported.Default:0
* Name: deferredUpdatesInterval(optional)
  * Type: number
  * Description: Minimum time interval in milliseconds that must pass since last reported location before alllater locations are reported in a batched updateDefault:0
* Name: deferredUpdatesTimeout(optional)
  * Type: number
  * Description: -
* Name: foregroundService(optional)
  * Type: LocationTaskServiceOptions
  * Description: -
* Name: pausesUpdatesAutomatically(optional)
  * Type: boolean
  * Description: Only for: iOSA boolean value indicating whether the location manager can pause locationupdates to improve battery life without sacrificing location data. When this option is set totrue, the location manager pauses updates (and powers down the appropriate hardware) at timeswhen the location data is unlikely to change. You can help the determination of when to pauselocation updates by assigning a value to the activityType property.Default:false
* Name: showsBackgroundLocationIndicator(optional)
  * Type: boolean
  * Description: Only for: iOS 11+A boolean indicating whether the status bar changes its appearance whenlocation services are used in the background.Default:false


### `LocationTaskServiceOptions`



* Name: killServiceOnDestroy(optional)
  * Type: boolean
  * Description: Boolean value whether to destroy the foreground service if the app is killed.
* Name: notificationBody
  * Type: string
  * Description: Subtitle of the foreground service notification.
* Name: notificationColor(optional)
  * Type: string
  * Description: Color of the foreground service notification. Accepts #RRGGBB and #AARRGGBB hex formats.
* Name: notificationTitle
  * Type: string
  * Description: Title of the foreground service notification.


### `PermissionDetailsLocationAndroid`


|Name    |Type                      |Description                             |
|--------|--------------------------|----------------------------------------|
|accuracy|'fine' | 'coarse' | 'none'|Indicates the type of location provider.|
|scope   |'fine' | 'coarse' | 'none'|Deprecated Use accuracy field instead.  |


### `PermissionDetailsLocationIOS`



* Name: scope
  * Type: 'whenInUse' | 'always' | 'none'
  * Description: The scope of granted permission. Indicates when it's possible to use location.


### `PermissionHookOptions`

Literal Type: multiple types

Acceptable values are: `PermissionHookBehavior` | `Options`

Enums
---------------

### `Accuracy`

Enum with available location accuracies.

Accuracy Values

#### `Lowest`

`Accuracy.Lowest ＝ 1`

Accurate to the nearest three kilometers.

#### `Low`

`Accuracy.Low ＝ 2`

Accurate to the nearest kilometer.

#### `Balanced`

`Accuracy.Balanced ＝ 3`

Accurate to within one hundred meters.

#### `High`

`Accuracy.High ＝ 4`

Accurate to within ten meters of the desired target.

#### `Highest`

`Accuracy.Highest ＝ 5`

The best level of accuracy available.

#### `BestForNavigation`

`Accuracy.BestForNavigation ＝ 6`

The highest possible accuracy that uses additional sensor data to facilitate navigation apps.

### `ActivityType`

Enum with available activity types of background location tracking.

ActivityType Values

#### `Other`

`ActivityType.Other ＝ 1`

Default activity type. Use it if there is no other type that matches the activity you track.

#### `AutomotiveNavigation`

`ActivityType.AutomotiveNavigation ＝ 2`

Location updates are being used specifically during vehicular navigation to track location changes to the automobile.

#### `Fitness`

`ActivityType.Fitness ＝ 3`

Use this activity type if you track fitness activities such as walking, running, cycling, and so on.

#### `OtherNavigation`

`ActivityType.OtherNavigation ＝ 4`

Activity type for movements for other types of vehicular navigation that are not automobile related.

Only for: 

#### `Airborne`

`ActivityType.Airborne ＝ 5`

Intended for airborne activities. Fall backs to `ActivityType.Other` if unsupported.

### `GeofencingEventType`

A type of the event that geofencing task can receive.

GeofencingEventType Values

#### `Enter`

`GeofencingEventType.Enter ＝ 1`

Emitted when the device entered observed region.

#### `Exit`

`GeofencingEventType.Exit ＝ 2`

Occurs as soon as the device left observed region

### `GeofencingRegionState`

State of the geofencing region that you receive through the geofencing task.

GeofencingRegionState Values

#### `Unknown`

`GeofencingRegionState.Unknown ＝ 0`

Indicates that the device position related to the region is unknown.

#### `Inside`

`GeofencingRegionState.Inside ＝ 1`

Indicates that the device is inside the region.

#### `Outside`

`GeofencingRegionState.Outside ＝ 2`

Inverse of inside state.

### `PermissionStatus`

PermissionStatus Values

#### `DENIED`

`PermissionStatus.DENIED ＝ "denied"`

User has denied the permission.

#### `GRANTED`

`PermissionStatus.GRANTED ＝ "granted"`

User has granted the permission.

#### `UNDETERMINED`

`PermissionStatus.UNDETERMINED ＝ "undetermined"`

User hasn't granted or denied the permission yet.

Permissions
---------------------------

### Android

> Note: Foreground and background services are not available in Expo Go for Android.

When you install the `expo-location` module, it automatically adds the following permissions:

*   `ACCESS_COARSE_LOCATION`: for approximate device location
*   `ACCESS_FINE_LOCATION`: for precise device location

The following permissions are optional:

*   `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION`: to be able to access location while the app is open but backgrounded. `FOREGROUND_SERVICE_LOCATION` is only required as of Android 14. When you enable this in a new build, you will need to submit your app for review and request access to use the foreground service permission.
*   `ACCESS_BACKGROUND_LOCATION`: to be able to access location while the app is backgrounded or closed. When you enable this in a new build, you will need to submit your app for review and request access to use the background location permission.



* Android Permission: ACCESS_COARSE_LOCATION
  * Description: Allows an app to access approximate location.Alternatively, you might want ACCESS_FINE_LOCATION.
* Android Permission: ACCESS_FINE_LOCATION
  * Description: Allows an app to access precise location.Alternatively, you might want ACCESS_COARSE_LOCATION.
* Android Permission: FOREGROUND_SERVICE
  * Description: Allows a regular application to use Service.startForeground.Allows a regular application to use Service.startForeground.
* Android Permission: FOREGROUND_SERVICE_LOCATION
  * Description: Allows a regular application to use Service.startForeground with the type "location".Allows a regular application to use Service.startForeground with the type "location".
* Android Permission: ACCESS_BACKGROUND_LOCATION
  * Description: Allows an app to access location in the background.If you're requesting this permission, you must also request either ACCESS_COARSE_LOCATION or ACCESS_FINE_LOCATION. Requesting this permission by itself doesn't give you location access.


#### Excluding a permission

> Note: Excluding a required permission from a module in your app can break the functionality corresponding to that permission. Always make sure to include all permissions a module is dependent on.

When your Expo project doesn't benefit from having particular permission included, you can omit it. For example, if your application doesn't need access to the precise location, you can exclude the `ACCESS_FINE_LOCATION` permission.

Another example can be stated using available location accuracies. Android defines the approximate location accuracy estimation within about 3 square kilometers, and the precise location accuracy estimation within about 50 meters. For example, if the location accuracy value is Low, you can exclude `ACCESS_FINE_LOCATION` permission. To learn more about levels of location accuracies, see Android documentation.

To learn more on how to exclude permission, see Excluding Android permissions.

### iOS

The following usage description keys are used by this library:



* Info.plist Key: NSLocationAlwaysAndWhenInUseUsageDescription
  * Description: A message that tells the user why the app is requesting access to the user’s location information at all times.
* Info.plist Key: NSLocationAlwaysUsageDescription
  * Description: A message that tells the user why the app is requesting access to the user's location at all times.DeprecatedFor apps deployed to targets in iOS 11 and later, use NSLocationAlwaysAndWhenInUseUsageDescription instead.
* Info.plist Key: NSLocationWhenInUseUsageDescription
  * Description: A message that tells the user why the app is requesting access to the user’s location information while the app is running in the foreground.

