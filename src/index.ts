import {
  requireNativeModule,
  requireNativeViewManager,
} from "expo-modules-core";
import React, { useImperativeHandle, useRef } from "react";
import { Platform, findNodeHandle } from "react-native";

let ExpoPencilKit: any | null = null;
let ExpoPencilKitViewManager: any | null = null;

if (Platform.OS === "ios") {
  ExpoPencilKit = requireNativeModule("ExpoPencilKitModule");
  ExpoPencilKitViewManager = requireNativeViewManager(
    "ExpoPencilKitModule"
  );
}

/**
 * Event payload for drawing start events
 */
export interface DrawStartEvent {
  data: string;
}

/**
 * Event payload for drawing end events
 */
export interface DrawEndEvent {
  data: string;
}

/**
 * Event payload for drawing change events
 */
export interface DrawChangeEvent {
  data: string;
}

/**
 * Event payload for can undo changed events
 */
export interface CanUndoChangedEvent {
  canUndo: boolean;
}

/**
 * Event payload for can redo changed events
 */
export interface CanRedoChangedEvent {
  canRedo: boolean;
}

/**
 * Native event wrapper for view component events
 */
export interface NativeEvent<T> {
  nativeEvent: T;
}

/**
 * Props for PencilKitView component
 */
export interface PencilKitViewProps {
  style?: any;
  imagePath?: { uri: string };
  onDrawStart?: (event: NativeEvent<DrawStartEvent>) => void;
  onDrawEnd?: (event: NativeEvent<DrawEndEvent>) => void;
  onDrawChange?: (event: NativeEvent<DrawChangeEvent>) => void;
  onCanUndoChanged?: (
    event: NativeEvent<CanUndoChangedEvent>
  ) => void;
  onCanRedoChanged?: (
    event: NativeEvent<CanRedoChangedEvent>
  ) => void;
}

/**
 * Ref methods available on PencilKitView
 */
export interface PencilKitViewRef {
  setupToolPicker(): Promise<void>;
  clearDrawing(): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
  captureDrawing(): Promise<string>;
  getCanvasDataAsBase64(): Promise<string>;
  setCanvasDataFromBase64(base64String: string): Promise<boolean>;
  canUndo(): Promise<boolean>;
  canRedo(): Promise<boolean>;
  setCanvasBackgroundColor(colorString: string): Promise<void>;
  getCanvasBackgroundColor(): Promise<string>;
  showColorPicker(): Promise<void>;
}

/**
 * PencilKit View Component
 */
export const PencilKitView = React.forwardRef<
  PencilKitViewRef,
  PencilKitViewProps
>((props, ref) => {
  const viewRef = useRef<any>(null);

  useImperativeHandle(
    ref,
    () => ({
      setupToolPicker: async () => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            await ExpoPencilKit.setupToolPicker(viewTag);
          }
        }
      },
      clearDrawing: async () => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            await ExpoPencilKit.clearDrawing(viewTag);
          }
        }
      },
      undo: async () => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            await ExpoPencilKit.undo(viewTag);
          }
        }
      },
      redo: async () => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            await ExpoPencilKit.redo(viewTag);
          }
        }
      },
      captureDrawing: async (): Promise<string> => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            return await ExpoPencilKit.captureDrawing(viewTag);
          }
        }
        return "";
      },
      getCanvasDataAsBase64: async (): Promise<string> => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            return await ExpoPencilKit.getCanvasDataAsBase64(viewTag);
          }
        }
        return "";
      },
      setCanvasDataFromBase64: async (
        base64String: string
      ): Promise<boolean> => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            return await ExpoPencilKit.setCanvasDataFromBase64(
              viewTag,
              base64String
            );
          }
        }
        return false;
      },
      canUndo: async (): Promise<boolean> => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            return await ExpoPencilKit.canUndo(viewTag);
          }
        }
        return false;
      },
      canRedo: async (): Promise<boolean> => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            return await ExpoPencilKit.canRedo(viewTag);
          }
        }
        return false;
      },
      setCanvasBackgroundColor: async (colorString: string) => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            await ExpoPencilKit.setCanvasBackgroundColor(
              viewTag,
              colorString
            );
          }
        }
      },
      getCanvasBackgroundColor: async (): Promise<string> => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            return await ExpoPencilKit.getCanvasBackgroundColor(
              viewTag
            );
          }
        }
        return "#FFFFFF";
      },
      showColorPicker: async () => {
        if (
          Platform.OS === "ios" &&
          ExpoPencilKit &&
          viewRef.current
        ) {
          const viewTag = findNodeHandle(viewRef.current);
          if (viewTag) {
            await ExpoPencilKit.showColorPicker(viewTag);
          }
        }
      },
    }),
    []
  );

  if (Platform.OS !== "ios" || !ExpoPencilKitViewManager) {
    return null;
  }

  return React.createElement(ExpoPencilKitViewManager, {
    ...props,
    ref: viewRef,
  });
});
