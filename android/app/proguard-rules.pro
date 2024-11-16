# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Keep Google Maps API classes and methods
-keep public class com.google.android.gms.maps.** { *; }
-keep public class com.google.maps.android.** { *; }
-keep public class com.google.android.gms.common.api.** { *; }

# Keep classes for Google Play Services
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.gms.maps.model.** { *; }

# Keep annotations used by Google Play Services
-keepattributes *Annotation*

# Keep Parcelable classes (used in Maps API)
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep classes used by Maps-related library reflection
-dontwarn com.google.android.gms.**
-dontwarn com.google.maps.android.**
-dontwarn com.google.maps.api.android.lib6.**
-dontwarn com.google.android.gms.maps.**
