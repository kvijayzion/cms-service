#!/bin/bash

# MySillyDreams Android Build Script

echo "🚀 Building MySillyDreams Android App..."

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME is not set. Please install Android SDK and set ANDROID_HOME."
    exit 1
fi

# Check if Java is available
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install JDK 11 or later."
    exit 1
fi

echo "✅ Environment checks passed"

# Initialize Gradle wrapper if not present
if [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
    echo "📦 Initializing Gradle wrapper..."
    gradle wrapper --gradle-version 8.2
fi

# Build the project
echo "🔨 Building debug APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📱 APK location: app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Build failed!"
    exit 1
fi
