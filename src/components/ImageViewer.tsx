// components/ImageViewer.tsx
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { NoteImage } from "../types";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const MIN_SCALE = 1;
const MAX_SCALE = 5;

type Props = {
  images: NoteImage[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
};

export function ImageViewer({ images, initialIndex = 0, visible, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);

  // Animaciones de escala y traslación
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Valores base acumulados entre gestos
  const lastScale = useRef(1);
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Refs de handlers para waitFor
  const pinchRef = useRef(null);
  const panRef = useRef(null);
  const doubleTapRef = useRef(null);

  const currentImage = images[currentIndex];

  const resetTransform = (animated = true) => {
    lastScale.current = 1;
    lastX.current = 0;
    lastY.current = 0;
    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
      ]).start();
    } else {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  // ── Pinch to zoom ───────────────────────────────────────────────
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, lastScale.current * event.nativeEvent.scale)
      );
      lastScale.current = newScale;
      scale.setValue(newScale);

      if (newScale <= 1) resetTransform();
    }
  };

  // ── Pan (arrastrar imagen con zoom activo) ──────────────────────
  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      lastX.current += event.nativeEvent.translationX;
      lastY.current += event.nativeEvent.translationY;
      translateX.setOffset(lastX.current);
      translateX.setValue(0);
      translateY.setOffset(lastY.current);
      translateY.setValue(0);
    }
  };

  // ── Double tap → zoom 2.5x / reset ─────────────────────────────
  const onDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      Haptics.selectionAsync();
      if (lastScale.current > 1) {
        resetTransform();
      } else {
        lastScale.current = 2.5;
        Animated.parallel([
          Animated.spring(scale, { toValue: 2.5, useNativeDriver: true, speed: 15, bounciness: 5 }),
        ]).start();
      }
    }
  };

  // ── Single tap → toggle controles ──────────────────────────────
  const onSingleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      setShowControls((v) => !v);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      resetTransform(false);
      setCurrentIndex((i) => i - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      resetTransform(false);
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleClose = () => {
    resetTransform(false);
    setCurrentIndex(initialIndex);
    onClose();
  };

  if (!currentImage) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden={!showControls} />
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.background} />

        {/* Imagen con gestos */}
        <TapGestureHandler
          ref={doubleTapRef}
          onHandlerStateChange={onDoubleTap}
          numberOfTaps={2}
        >
          <TapGestureHandler
            onHandlerStateChange={onSingleTap}
            numberOfTaps={1}
            waitFor={doubleTapRef}
          >
            <Animated.View style={StyleSheet.absoluteFill}>
              <PinchGestureHandler
                ref={pinchRef}
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View style={StyleSheet.absoluteFill}>
                  <PanGestureHandler
                    ref={panRef}
                    onGestureEvent={onPanEvent}
                    onHandlerStateChange={onPanStateChange}
                    simultaneousHandlers={pinchRef}
                    minPointers={1}
                    maxPointers={2}
                  >
                    <Animated.View
                      style={[
                        styles.imageWrapper,
                        {
                          transform: [
                            { scale },
                            { translateX },
                            { translateY },
                          ],
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: currentImage.uri }}
                        style={styles.image}
                        contentFit="contain"
                        transition={200}
                      />
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </TapGestureHandler>

        {/* Controles superiores */}
        {showControls && (
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>
            <TouchableOpacity style={styles.controlBtn} onPress={resetTransform}>
              <Ionicons name="scan-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Navegación entre imágenes */}
        {showControls && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.navLeft} onPress={goToPrev}>
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity style={styles.navRight} onPress={goToNext}>
                <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Dots indicadores */}
        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Hint zoom */}
        {showControls && (
          <View style={styles.hintRow}>
            <Ionicons name="expand-outline" size={13} color="rgba(255,255,255,0.4)" />
            <Text style={styles.hintText}>Pellizca para zoom · Doble tap para 2.5x</Text>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.97)",
    alignItems: "center",
    justifyContent: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  imageWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },

  // Top bar
  topBar: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Navigation
  navLeft: {
    position: "absolute",
    left: 12,
    top: "50%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  navRight: {
    position: "absolute",
    right: 12,
    top: "50%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  // Dots
  dotsRow: {
    position: "absolute",
    bottom: 60,
    flexDirection: "row",
    gap: 6,
    alignSelf: "center",
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 18,
  },

  // Hint
  hintRow: {
    position: "absolute",
    bottom: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
  },
});