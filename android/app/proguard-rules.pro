# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.** { *; }
-keep class com.th3rdwave.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Reanimated
-keep class com.swmansion.reanimated.** { *; }

# Expo
-keep class expo.** { *; }
-keep class host.exp.** { *; }

# Keep all classes
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-dontwarn com.facebook.**
-dontwarn com.google.**
