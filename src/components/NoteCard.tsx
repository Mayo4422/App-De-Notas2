// components/NoteCard.tsx
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useNotes } from "../context/NotesContext";
import { Note, ViewMode, ACCENT_COLORS } from "../types";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const GRID_CARD_WIDTH = (width - 24 - 8) / 2;

type Props = {
  note: Note;
  viewMode: ViewMode;
  index: number;
  onPress: () => void;
};

export function NoteCard({ note, viewMode, index, onPress }: Props) {
  const { togglePin, toggleFavorite, deleteNote } = useNotes();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeableRef = useRef<Swipeable>(null);
  const accentColor = ACCENT_COLORS[note.color];

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Eliminar nota",
      `¿Eliminar "${note.title}"? Esta acción no se puede deshacer.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteNote(note.id),
        },
      ]
    );
  };

  const handleSwipeOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Acción derecha — eliminar
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: "clamp",
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          viewMode === "grid" && styles.deleteActionGrid,
          { opacity },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash" size={22} color="#FFFFFF" />
          </Animated.View>
          <Animated.Text style={[styles.deleteText, { transform: [{ scale }] }]}>
            Eliminar
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Acción izquierda — fijar
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: "clamp",
    });
    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.pinAction,
          viewMode === "grid" && styles.pinActionGrid,
          { opacity },
        ]}
      >
        <TouchableOpacity
          style={styles.pinBtn}
          onPress={() => {
            Haptics.selectionAsync();
            togglePin(note.id);
            swipeableRef.current?.close();
          }}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons
              name={note.isPinned ? "pin-outline" : "pin"}
              size={22}
              color="#FFFFFF"
            />
          </Animated.View>
          <Animated.Text style={[styles.pinText, { transform: [{ scale }] }]}>
            {note.isPinned ? "Desfijar" : "Fijar"}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  const previewText =
    note.content.length > 0
      ? note.content.replace(/\n+/g, " ").trim()
      : null;

  if (viewMode === "list") {
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={handleSwipeOpen}
        friction={2}
        leftThreshold={60}
        rightThreshold={60}
        overshootLeft={false}
        overshootRight={false}
        containerStyle={styles.swipeContainer}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.listCard, { backgroundColor: note.color }]}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
          >
            <View style={[styles.listAccentBar, { backgroundColor: accentColor }]} />
            <View style={styles.listContent}>
              <View style={styles.listTopRow}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {note.title}
                </Text>
                <View style={styles.listMeta}>
                  {note.isPinned && (
                    <Ionicons name="pin" size={13} color={accentColor} />
                  )}
                  {note.isFavorite && (
                    <Ionicons name="heart" size={13} color="#EE4540" />
                  )}
                  <Text style={styles.listDate}>{formatDate(note.updatedAt)}</Text>
                </View>
              </View>
              {previewText && (
                <Text style={styles.listPreview} numberOfLines={2}>
                  {previewText}
                </Text>
              )}
              {note.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {note.tags.slice(0, 3).map((tag) => (
                    <View
                      key={tag.id}
                      style={[
                        styles.tagBadge,
                        {
                          backgroundColor: tag.color + "22",
                          borderColor: tag.color + "66",
                        },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: tag.color }]}>
                        {tag.label}
                      </Text>
                    </View>
                  ))}
                  {note.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>
                      +{note.tags.length - 3}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  }

  // GRID MODE — swipe solo a la derecha para eliminar
  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      friction={2}
      rightThreshold={60}
      overshootRight={false}
      containerStyle={[
        styles.gridSwipeContainer,
        index % 2 === 0 ? { marginRight: 4 } : { marginLeft: 4 },
      ]}
    >
      <Animated.View
        style={[
          styles.gridWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: note.color }]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <View style={styles.gridTopRow}>
            <View style={[styles.gridAccentDot, { backgroundColor: accentColor }]} />
            <View style={styles.gridIcons}>
              {note.isPinned && (
                <Ionicons name="pin" size={13} color={accentColor} />
              )}
              {note.isFavorite && (
                <Ionicons name="heart" size={12} color="#EE4540" />
              )}
            </View>
          </View>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {note.title}
          </Text>
          {previewText && (
            <Text style={styles.gridPreview} numberOfLines={3}>
              {previewText}
            </Text>
          )}
          <View style={{ flex: 1 }} />
          <View style={styles.gridBottomRow}>
            {note.tags.length > 0 ? (
              <View
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: note.tags[0].color + "22",
                    borderColor: note.tags[0].color + "55",
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: note.tags[0].color }]}>
                  {note.tags[0].label}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <Text style={styles.gridDate}>{formatDate(note.updatedAt)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // Swipe containers
  swipeContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  gridSwipeContainer: {
    width: GRID_CARD_WIDTH,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },

  // Delete action (derecha)
  deleteAction: {
    width: 90,
    marginBottom: 0,
    borderRadius: 0,
    overflow: "hidden",
  },
  deleteActionGrid: {
    width: 80,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#EE4540",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // Pin action (izquierda)
  pinAction: {
    width: 90,
    overflow: "hidden",
  },
  pinActionGrid: {
    width: 80,
  },
  pinBtn: {
    flex: 1,
    backgroundColor: "#7C83FD",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pinText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  // LIST styles
  listCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 72,
  },
  listAccentBar: {
    width: 3,
    borderRadius: 2,
    margin: 10,
    marginRight: 0,
  },
  listContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
  },
  listTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    letterSpacing: -0.2,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  listDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },
  listPreview: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
    alignItems: "center",
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  moreTagsText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },

  // GRID styles
  gridWrapper: {
    flex: 1,
  },
  gridCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 150,
  },
  gridTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  gridAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gridIcons: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
    marginBottom: 6,
    lineHeight: 20,
  },
  gridPreview: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 17,
    marginBottom: 8,
  },
  gridBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  gridDate: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
  },
});