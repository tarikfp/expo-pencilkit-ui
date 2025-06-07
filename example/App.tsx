import {
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  CanRedoChangedEvent,
  CanUndoChangedEvent,
  DrawChangeEvent,
  DrawEndEvent,
  DrawStartEvent,
  NativeEvent,
  PencilKitView,
  PencilKitViewRef,
} from "expo-pencilkit-ui";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const CANVAS_SIZE = Math.min(screenWidth - 32);

export default function PencilKitDemo() {
  const pencilKitRef = useRef<PencilKitViewRef>(null);

  const [canUndoState, setCanUndoState] = useState(false);
  const [canvasRerenderKey, setCanvasRerenderKey] = useState(0);
  const [canRedoState, setCanRedoState] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("");
  const [backgroundColorInput, setBackgroundColorInput] =
    useState("FFFFFF");

  const [backgroundImage, setBackgroundImage] = useState<
    string | null
  >(null);

  const [savedCanvasData, setSavedCanvasData] = useState("");

  useEffect(() => {
    const setupTimer = setTimeout(() => {
      if (pencilKitRef.current) {
        pencilKitRef.current.setupToolPicker();
      }
    }, 100);

    const getInitialBgColor = async () => {
      if (pencilKitRef.current) {
        try {
          const bgColor =
            await pencilKitRef.current.getCanvasBackgroundColor();
          setBackgroundColor(bgColor);
          setBackgroundColorInput(bgColor);
        } catch (error) {}
      }
    };

    setTimeout(getInitialBgColor, 200);

    return () => {
      clearTimeout(setupTimer);
    };
  }, []);

  const handleDrawStart = (event: NativeEvent<DrawStartEvent>) => {
    setIsDrawing(true);
  };

  const handleDrawEnd = (event: NativeEvent<DrawEndEvent>) => {
    setIsDrawing(false);
  };

  const handleDrawChange = (event: NativeEvent<DrawChangeEvent>) => {
    console.log("Draw Change", event.nativeEvent.data);
  };

  const handleCanUndoChanged = (
    event: NativeEvent<CanUndoChangedEvent>
  ) => {
    setCanUndoState(event.nativeEvent.canUndo);
  };

  const handleCanRedoChanged = (
    event: NativeEvent<CanRedoChangedEvent>
  ) => {
    setCanRedoState(event.nativeEvent.canRedo);
  };

  const handleUndo = () => {
    if (pencilKitRef.current) {
      pencilKitRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (pencilKitRef.current) {
      pencilKitRef.current.redo();
    }
  };

  const handleClear = () => {
    if (pencilKitRef.current) {
      pencilKitRef.current.clearDrawing();
    }
  };

  const handleShowColorPicker = () => {
    if (pencilKitRef.current) {
      pencilKitRef.current.showColorPicker();
    }
  };

  const handleSetBackgroundColor = async () => {
    if (pencilKitRef.current && backgroundColorInput) {
      try {
        pencilKitRef.current.setCanvasBackgroundColor(
          backgroundColorInput
        );
        setBackgroundColor(backgroundColorInput);
      } catch (error) {}
    }
  };

  const handleGetBackgroundColor = async () => {
    if (pencilKitRef.current) {
      try {
        const color =
          await pencilKitRef.current.getCanvasBackgroundColor();
        setBackgroundColor(color);
        setBackgroundColorInput(color);
      } catch (error) {}
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBackgroundImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleRemoveBackgroundImage = () => {
    setBackgroundImage(null);
    // ugly workaround to rerender the canvas
    // TODO: find a better way to do this
    setCanvasRerenderKey((prev) => prev + 1);
  };

  const handleSaveCanvasData = async () => {
    if (pencilKitRef.current) {
      try {
        const data =
          await pencilKitRef.current.getCanvasDataAsBase64();
        setSavedCanvasData(data);
        Alert.alert(
          "Success",
          `Canvas data saved (${Math.round(data.length / 1024)}KB)`
        );
      } catch (error) {
        Alert.alert("Error", "Failed to save canvas data");
      }
    }
  };

  const handleExportImage = async () => {
    if (pencilKitRef.current) {
      try {
        const imageData = await pencilKitRef.current.captureDrawing();

        const shareOptions = {
          title: "PencilKit Drawing",
          message: "Check out my drawing!",
          url: `data:image/png;base64,${imageData}`,
        };

        await Share.share(shareOptions);
      } catch (error) {
        Alert.alert("Error", "Failed to export and share image");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎨 Expo PencilKit Demo</Text>
        </View>

        <View
          style={[styles.section, { backgroundColor: "transparent" }]}
        >
          <Text style={styles.sectionTitle}>Drawing Canvas</Text>
          <View style={styles.canvasContainer}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  isDrawing && styles.statusActive,
                ]}
              >
                <Text style={styles.statusText}>
                  {isDrawing ? "✏️ Drawing" : "✋ Idle"}
                </Text>
              </View>
            </View>

            <View style={styles.canvasControls}>
              <View style={styles.controlRow}>
                <Pressable
                  style={[
                    styles.controlButton,
                    !canUndoState && styles.controlButtonDisabled,
                  ]}
                  onPress={handleUndo}
                  disabled={!canUndoState}
                >
                  <FontAwesome5 name="undo" size={16} color="white" />
                </Pressable>

                <Pressable
                  style={[
                    styles.controlButton,
                    !canRedoState && styles.controlButtonDisabled,
                  ]}
                  onPress={handleRedo}
                  disabled={!canRedoState}
                >
                  <FontAwesome5 name="redo" size={16} color="white" />
                </Pressable>
              </View>

              <View style={styles.controlRow}>
                <Pressable
                  style={styles.controlButton}
                  onPress={handleShowColorPicker}
                >
                  <FontAwesome5
                    name="palette"
                    size={16}
                    color="white"
                  />
                </Pressable>

                <Pressable
                  style={styles.controlButton}
                  onPress={handleClear}
                >
                  <MaterialCommunityIcons
                    name="eraser"
                    size={16}
                    color="white"
                  />
                </Pressable>
              </View>
            </View>
            <View style={styles.canvasWrapper}>
              <PencilKitView
                key={canvasRerenderKey.toString()}
                ref={pencilKitRef}
                style={styles.canvas}
                imagePath={
                  backgroundImage
                    ? { uri: backgroundImage }
                    : undefined
                }
                onDrawStart={handleDrawStart}
                onDrawEnd={handleDrawEnd}
                onDrawChange={handleDrawChange}
                onCanUndoChanged={handleCanUndoChanged}
                onCanRedoChanged={handleCanRedoChanged}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            💾 Canvas Data Management
          </Text>
          <View style={styles.dataButtonsContainer}>
            <Pressable
              style={styles.actionButton}
              onPress={handleSaveCanvasData}
            >
              <FontAwesome5 name="save" size={14} color="white" />
              <Text style={styles.actionButtonText}>Save Data</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={handleExportImage}
            >
              <FontAwesome5 name="share" size={14} color="white" />
              <Text style={styles.actionButtonText}>Share Image</Text>
            </Pressable>
          </View>
          <Text style={styles.dataStatusText}>
            Saved Data:{" "}
            {savedCanvasData
              ? `${Math.round(savedCanvasData.length / 1024)}KB`
              : "None"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🎨 Canvas Background
          </Text>

          <View style={styles.backgroundSubSection}>
            <Text style={styles.subSectionTitle}>
              Background Image
            </Text>
            {backgroundImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: backgroundImage }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <Text style={styles.imagePreviewText}>
                  Current Background
                </Text>
              </View>
            )}
            <View style={styles.imageButtonsContainer}>
              <Pressable
                style={styles.actionButton}
                onPress={handlePickImage}
              >
                <FontAwesome5 name="image" size={14} color="white" />
                <Text style={styles.actionButtonText}>
                  Pick Image
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  !backgroundImage && styles.actionButtonDisabled,
                ]}
                onPress={handleRemoveBackgroundImage}
                disabled={!backgroundImage}
              >
                <FontAwesome5 name="trash" size={14} color="white" />
                <Text style={styles.actionButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.backgroundSubSection}>
            <Text style={styles.subSectionTitle}>
              Background Color
            </Text>
            <View style={styles.colorInputContainer}>
              <Text style={styles.inputLabel}>Hex Color:</Text>
              <TextInput
                style={styles.colorInput}
                value={backgroundColorInput}
                onChangeText={setBackgroundColorInput}
                placeholder="FFFFFF"
                maxLength={6}
                autoCapitalize="characters"
              />
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: `#${backgroundColorInput}` },
                ]}
              />
            </View>
            <View style={styles.colorButtonsContainer}>
              <Pressable
                style={styles.actionButton}
                onPress={handleSetBackgroundColor}
              >
                <Text style={styles.actionButtonText}>Set Color</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={handleGetBackgroundColor}
              >
                <Text style={styles.actionButtonText}>Get Color</Text>
              </Pressable>
            </View>
            <Text style={styles.currentColorText}>
              Current: #{backgroundColor || "FFFFFF"}
            </Text>
          </View>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  section: {
    backgroundColor: "white",
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  canvasContainer: {
    alignItems: "center",
    position: "relative",
  },
  statusContainer: {
    position: "absolute",
    top: -8,
    left: 8,
    zIndex: 10,
  },
  statusIndicator: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: "#28a745",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  canvasControls: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    gap: 8,
  },
  controlRow: {
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    backgroundColor: "#007bff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonDisabled: {
    backgroundColor: "#adb5bd",
  },
  canvasWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: "white",
  },

  backgroundSubSection: {
    marginBottom: 20,
    paddingBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#495057",
    marginBottom: 12,
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#dee2e6",
  },
  imagePreviewText: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
  },
  imageButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  colorInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    minWidth: 70,
  },
  colorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: "monospace",
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#dee2e6",
  },
  colorButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  currentColorText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    fontFamily: "monospace",
  },
  actionButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flex: 1,
  },
  actionButtonDisabled: {
    backgroundColor: "#adb5bd",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  dataButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dataStatusText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    fontFamily: "monospace",
  },

  footer: {
    height: 50,
  },
});
