// components/NoteCard.tsx
import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotes } from "../context/NotesContext";
import { Note, ViewMode, ACCENT_COLORS } from "../types";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const GRID_CARD_WIDTH = (width - 24 - 8) / 2; // 2 cols, padding 12 each side, gap 8

type Props = {
  note: Note;
  viewMode: ViewMode;
  index: number;
  onPress: () => void;
};

export function NoteCard({ note, viewMode, index, onPress }: Props) {
  const { togglePin, toggleFavorite, deleteNote } = useNotes();
  const scaleAnim = useRef(new Animated.Value(1)).current;
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

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const previewText = note.content.length > 0
    ? note.content.replace(/\n+/g, " ").trim()
    : null;

  if (viewMode === "list") {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.listCard, { backgroundColor: note.color }]}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onLongPress={handleLongPress}
          activeOpacity={1}
        >
          {/* Left accent bar */}
          <View style={[styles.listAccentBar, { backgroundColor: accentColor }]} />

          <View style={styles.listContent}>
            {/* Top row */}
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

            {/* Preview */}
            {previewText && (
              <Text style={styles.listPreview} numberOfLines={2}>
                {previewText}
              </Text>
            )}

            {/* Tags */}
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
                  <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // GRID MODE
  return (
    <Animated.View
      style={[
        styles.gridWrapper,
        { transform: [{ scale: scaleAnim }] },
        index % 2 === 0 ? { marginRight: 4 } : { marginLeft: 4 },
      ]}
    >
      <TouchableOpacity
        style={[styles.gridCard, { backgroundColor: note.color }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLongPress={handleLongPress}
        activeOpacity={1}
      >
        {/* Top indicators */}
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

        {/* Title */}
        <Text style={styles.gridTitle} numberOfLines={2}>
          {note.title}
        </Text>

        {/* Preview */}
        {previewText && (
          <Text style={styles.gridPreview} numberOfLines={3}>
            {previewText}
          </Text>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Bottom row */}
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
  );
}

const styles = StyleSheet.create({
  // LIST styles
  listCard: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginBottom: 8,
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
    width: GRID_CARD_WIDTH,
    marginBottom: 8,
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