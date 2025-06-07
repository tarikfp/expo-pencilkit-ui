# expo-pencilkit-ui ✏️

[![npm version](https://badge.fury.io/js/expo-pencilkit-ui.svg)](https://badge.fury.io/js/expo-pencilkit-ui)
[![npm downloads](https://img.shields.io/npm/dm/expo-pencilkit-ui.svg)](https://www.npmjs.com/package/expo-pencilkit-ui)
[![npm license](https://img.shields.io/npm/l/expo-pencilkit-ui.svg)](https://www.npmjs.com/package/expo-pencilkit-ui)
[![platform](https://img.shields.io/badge/platform-iOS-lightgrey.svg)](https://www.npmjs.com/package/expo-pencilkit-ui)


A React Native Expo module that provides native Apple PencilKit integration for iOS applications. Enable natural drawing experiences with Apple Pencil support, pressure sensitivity, and advanced drawing tools.

Built with the [Expo Modules API](https://docs.expo.dev/modules/overview/) for optimal performance and developer experience.

## Demo


https://github.com/user-attachments/assets/b48ab983-1a39-4b36-95af-0d42f2b23565



## Installation

```bash
npx expo install expo-pencilkit-ui
```

No additional configuration required for Expo managed workflow.

## Basic Usage

```tsx
import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { PencilKitView, PencilKitViewRef } from "expo-pencilkit-ui";

export default function App() {
  const pencilKitRef = useRef<PencilKitViewRef>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pencilKitRef.current) {
        pencilKitRef.current.setupToolPicker();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <PencilKitView
        ref={pencilKitRef}
        style={styles.canvas}
        onDrawStart={(event) => console.log("Drawing started")}
        onDrawEnd={(event) => console.log("Drawing ended")}
        onCanUndoChanged={(event) =>
          console.log("Can undo:", event.nativeEvent.canUndo)
        }
        onCanRedoChanged={(event) =>
          console.log("Can redo:", event.nativeEvent.canRedo)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  canvas: {
    flex: 1,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 8,
  },
});
```

## Advanced Usage

```tsx
import React, { useRef, useState, useEffect } from "react";
import { View, Button, Alert, StyleSheet } from "react-native";
import { PencilKitView, PencilKitViewRef } from "expo-pencilkit-ui";
import * as ImagePicker from "expo-image-picker";

export default function AdvancedPencilKit() {
  const pencilKitRef = useRef<PencilKitViewRef>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (pencilKitRef.current) {
      pencilKitRef.current.setupToolPicker();
    }
  }, []);

  const handleUndo = () => {
    pencilKitRef.current?.undo();
  };

  const handleRedo = () => {
    pencilKitRef.current?.redo();
  };

  const handleClear = () => {
    pencilKitRef.current?.clearDrawing();
  };

  const handleSave = async () => {
    try {
      const data =
        await pencilKitRef.current?.getCanvasDataAsBase64();
      if (data) {
        // Save to storage or send to server
        Alert.alert("Success", "Drawing saved!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save drawing");
    }
  };

  const handleCapture = async () => {
    try {
      const imageData = await pencilKitRef.current?.captureDrawing();
      if (imageData) {
        // Share or save the image
        Alert.alert("Success", "Image captured!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image");
    }
  };

  const pickBackgroundImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBackgroundImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <PencilKitView
        ref={pencilKitRef}
        style={styles.canvas}
        imagePath={
          backgroundImage ? { uri: backgroundImage } : undefined
        }
        onCanUndoChanged={(event) =>
          setCanUndo(event.nativeEvent.canUndo)
        }
        onCanRedoChanged={(event) =>
          setCanRedo(event.nativeEvent.canRedo)
        }
      />

      <View style={styles.controls}>
        <Button
          title="Undo"
          onPress={handleUndo}
          disabled={!canUndo}
        />
        <Button
          title="Redo"
          onPress={handleRedo}
          disabled={!canRedo}
        />
        <Button title="Clear" onPress={handleClear} />
        <Button title="Save" onPress={handleSave} />
        <Button title="Capture" onPress={handleCapture} />
        <Button title="Background" onPress={pickBackgroundImage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: "white",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#f0f0f0",
  },
});
```

## API Reference

### PencilKitView Component

#### Props

| Prop               | Type                                                | Description                      |
| ------------------ | --------------------------------------------------- | -------------------------------- |
| `style`            | `ViewStyle`                                         | Style object for the canvas view |
| `imagePath`        | `{ uri: string }`                                   | Optional background image        |
| `onDrawStart`      | `(event: NativeEvent<DrawStartEvent>) => void`      | Called when drawing starts       |
| `onDrawEnd`        | `(event: NativeEvent<DrawEndEvent>) => void`        | Called when drawing ends         |
| `onDrawChange`     | `(event: NativeEvent<DrawChangeEvent>) => void`     | Called during drawing            |
| `onCanUndoChanged` | `(event: NativeEvent<CanUndoChangedEvent>) => void` | Called when undo state changes   |
| `onCanRedoChanged` | `(event: NativeEvent<CanRedoChangedEvent>) => void` | Called when redo state changes   |

#### Ref Methods

| Method                     | Parameters        | Return Type        | Description                             |
| -------------------------- | ----------------- | ------------------ | --------------------------------------- |
| `setupToolPicker`          | `()`              | `void`             | Initialize the Apple Pencil tool picker |
| `undo`                     | `()`              | `void`             | Undo the last drawing action            |
| `redo`                     | `()`              | `void`             | Redo the last undone action             |
| `clearDrawing`             | `()`              | `void`             | Clear all drawing content               |
| `showColorPicker`          | `()`              | `void`             | Display the color picker                |
| `captureDrawing`           | `()`              | `Promise<string>`  | Capture canvas as base64 PNG            |
| `getCanvasDataAsBase64`    | `()`              | `Promise<string>`  | Get drawing data as base64              |
| `setCanvasDataFromBase64`  | `(data: string)`  | `Promise<boolean>` | Load drawing from base64 data           |
| `canUndo`                  | `()`              | `Promise<boolean>` | Check if undo is available              |
| `canRedo`                  | `()`              | `Promise<boolean>` | Check if redo is available              |
| `setCanvasBackgroundColor` | `(color: string)` | `void`             | Set background color (hex)              |
| `getCanvasBackgroundColor` | `()`              | `Promise<string>`  | Get current background color            |

### Event Types

```tsx
interface DrawStartEvent {
  data: string; // Base64 drawing data
}

interface DrawEndEvent {
  data: string; // Base64 drawing data
}

interface DrawChangeEvent {
  data: string; // Base64 drawing data
}

interface CanUndoChangedEvent {
  canUndo: boolean;
}

interface CanRedoChangedEvent {
  canRedo: boolean;
}
```

## Features

- **Native Integration**: Direct Apple PencilKit implementation
- **Pressure Sensitivity**: Full Apple Pencil pressure and tilt support
- **Tool Picker**: Native iOS drawing tools (pen, pencil, marker, eraser)
- **Undo/Redo**: Complete drawing history management
- **Background Images**: Support for custom background images
- **Data Persistence**: Save and load drawing data
- **Image Export**: Capture drawings as PNG images
- **Real-time Events**: Drawing state change notifications
- **Color Customization**: Background color and tool color support

## Platform Support

- **iOS**: Full support with Apple PencilKit
- **Android**: Not supported (Apple PencilKit is iOS-only)
