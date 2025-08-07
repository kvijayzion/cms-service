# MySillyDreams Android App

A beautiful Android application built with Kotlin and Jetpack Compose, featuring the same design style and components as the web version.

## Features

### 🎨 Design & UI
- **Neumorphic Design**: Beautiful neumorphic components matching the web version
- **Dark/Light Theme**: Automatic theme switching with smooth transitions
- **Animated Elements**: Smooth animations and transitions throughout the app
- **Material Design 3**: Modern Material Design components and theming

### 🔐 Authentication
- **Google Sign-In**: Seamless Google authentication integration
- **Loading States**: Beautiful loading animations during sign-in
- **Error Handling**: Graceful error handling with toast messages

### 📱 Mobile-First Features
- **Responsive Design**: Optimized for all screen sizes
- **Touch Interactions**: Smooth touch feedback and gestures
- **System Integration**: Proper status bar and navigation handling

## Tech Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with Compose
- **Authentication**: Firebase Auth + Google Sign-In
- **Animations**: Compose Animation APIs
- **Theme**: Material Design 3 with custom neumorphic components

## Project Structure

```
app/
├── src/main/java/com/mysillydeams/app/
│   ├── MainActivity.kt                 # Main activity
│   ├── ui/
│   │   ├── theme/                     # Theme and styling
│   │   │   ├── Color.kt               # Color definitions
│   │   │   ├── Theme.kt               # Theme configuration
│   │   │   └── Type.kt                # Typography
│   │   ├── components/                # Reusable UI components
│   │   │   └── NeumorphicComponents.kt # Neumorphic design components
│   │   └── screens/                   # App screens
│   │       └── LoginScreen.kt         # Login screen implementation
│   └── res/                          # Resources
│       ├── values/                   # Values and strings
│       ├── drawable/                 # Icons and drawables
│       └── mipmap/                   # App icons
```

## Design Features

### Neumorphic Components
- **NeumorphicBox**: Container with soft shadows and highlights
- **NeumorphicButton**: Interactive buttons with press states
- **GradientBackground**: Animated gradient backgrounds

### Animations
- **Logo Animation**: Bouncy scale and rotation animations
- **Content Fade-in**: Staggered content appearance
- **Background Elements**: Floating animated elements
- **Loading States**: Smooth loading indicators

### Color Scheme
- **Brand Colors**: Purple, Pink, and Indigo gradients
- **Neumorphic Shadows**: Soft shadows for depth
- **Theme Support**: Automatic dark/light mode switching

## Building the Project

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 11 or later
- Android SDK 24+ (Android 7.0)

### Build Commands
```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease

# Install on device
./gradlew installDebug
```

### Dependencies
- Jetpack Compose BOM 2023.10.01
- Material Design 3
- Firebase Auth
- Google Play Services Auth
- Accompanist System UI Controller
- Kotlin Coroutines

## Configuration

### Firebase Setup
1. Add your `google-services.json` file to `app/` directory
2. Configure Firebase Authentication in the Firebase Console
3. Enable Google Sign-In provider

### Theme Customization
- Modify colors in `ui/theme/Color.kt`
- Adjust typography in `ui/theme/Type.kt`
- Update theme configuration in `ui/theme/Theme.kt`

## Features Matching Web Version

### Visual Design
- ✅ Neumorphic card design
- ✅ Gradient backgrounds
- ✅ Brand color scheme
- ✅ Typography hierarchy
- ✅ Icon consistency

### Interactions
- ✅ Google Sign-In button
- ✅ Theme toggle functionality
- ✅ Loading states
- ✅ Error handling
- ✅ Toast messages

### Animations
- ✅ Logo entrance animation
- ✅ Content fade-in effects
- ✅ Button press feedback
- ✅ Background animations
- ✅ Smooth transitions

## Future Enhancements

- [ ] Video player integration
- [ ] Content browsing screens
- [ ] User profile management
- [ ] Push notifications
- [ ] Offline support
- [ ] Social features

## License

This project is part of the MySillyDreams platform.
