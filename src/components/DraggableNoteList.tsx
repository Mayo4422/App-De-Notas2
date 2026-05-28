// components/DraggableNoteList.tsx
import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, PanResponder, Animated, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNotes } from "../context/NotesContext";
import { Note, ACCENT_COLORS } from "../types";
import * as Haptics from "expo-haptics";

const ITEM_HEIGHT = 76;

type Props = {
  onExitDragMode: () => void;
};

export function DraggableNoteList({ onExitDragMode }: Props) {
  const { notes, reorderNotes } = useNotes();
  const [data, setData] = useState<Note[]>([...notes]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const currentDragY = useRef(0);
  const scrollOffset = useRef(0);

  const getIndexFromY = (y: number) => {
    const idx = Math.floor((y + scrollOffset.current) / ITEM_HEIGHT);
    return Math.max(0, Math.min(data.length - 1, idx));
  };

  const createPanResponder = (index: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        dragStartY.current = e.nativeEvent.pageY;
        currentDragY.current = 0;
        dragY.setValue(0);
        setDraggingIndex(index);
        setHoverIndex(index);
      },
      onPanResponderMove: (e, gs) => {
        currentDragY.current = gs.dy;
        dragY.setValue(gs.dy);
        const newHover = getIndexFromY(
          dragStartY.current + gs.dy - ITEM_HEIGHT / 2
        );
        if (newHover !== hoverIndex) {
          Haptics.selectionAsync();
          setHoverIndex(newHover);
        }
      },
      onPanResponderRelease: () => {
        if (draggingIndex !== null && hoverIndex !== null && draggingIndex !== hoverIndex) {
          const newData = [...data];
          const [removed] = newData.splice(draggingIndex, 1);
          newData.splice(hoverIndex, 0, removed);
          setData(newData);
          reorderNotes(newData);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        dragY.setValue(0);
        setDraggingIndex(null);
        setHoverIndex(null);
      },
      onPanResponderTerminate: () => {
        dragY.setValue(0);
        setDraggingIndex(null);
        setHoverIndex(null);
      },
    });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.dragModeHeader}>
        <View style={styles.dragModeInfo}>
          <Ionicons name="reorder-three" size={18} color="#7C83FD" />
          <Text style={styles.dragModeTitle}>Modo reordenar</Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={onExitDragMode}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.doneBtnText}>Listo</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.dragHint}>
        Mantén presionado ≡ y arrastra para reordenar
      </Text>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
        // Desactivar scroll cuando se arrastra
        scrollEnabled={draggingIndex === null}
      >
        {data.map((item, index) => {
          const accentColor = ACCENT_COLORS[item.color];
          const isDragging = draggingIndex === index;
          const isHover = hoverIndex === index && draggingIndex !== null && draggingIndex !== index;
          const panResponder = createPanResponder(index);

          return (
            <Animated.View
              key={item.id}
              style={[
                styles.itemContainer,
                isDragging && {
                  transform: [{ translateY: dragY }],
                  zIndex: 999,
                  elevation: 12,
                },
                isHover && styles.itemHover,
              ]}
            >
              {/* Index */}
              <View style={[styles.indexBadge, { borderColor: accentColor + "60" }]}>
                <Text style={[styles.indexText, { color: accentColor }]}>
                  {index + 1}
                </Text>
              </View>

              {/* Card */}
              <TouchableOpacity
                style={[
                  styles.card,
                  { backgroundColor: item.color },
                  isDragging && styles.cardDragging,
                ]}
                onPress={() => {
                  if (draggingIndex === null) router.push(`/note/${item.id}`);
                }}
                activeOpacity={0.9}
              >
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.badges}>
                      {item.isPinned && <Ionicons name="pin" size={12} color={accentColor} />}
                      {item.isFavorite && <Ionicons name="heart" size={12} color="#EE4540" />}
                      {(item.images?.length ?? 0) > 0 && (
                        <View style={styles.imageBadge}>
                          <Ionicons name="image-outline" size={11} color="rgba(255,255,255,0.5)" />
                          <Text style={styles.imageBadgeText}>{item.images.length}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {item.content.length > 0 && (
                    <Text style={styles.cardPreview} numberOfLines={1}>
                      {item.content.replace(/\n+/g, " ").trim()}
                    </Text>
                  )}
                  <View style={styles.cardFooter}>
                    {item.tags.length > 0 && (
                      <View style={[styles.tagPill, { backgroundColor: item.tags[0].color + "22", borderColor: item.tags[0].color + "55" }]}>
                        <Text style={[styles.tagText, { color: item.tags[0].color }]}>
                          {item.tags[0].label}
                          {item.tags.length > 1 ? ` +${item.tags.length - 1}` : ""}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.dateText}>{formatDate(item.updatedAt)}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Drag handle con PanResponder */}
              <Animated.View
                style={[
                  styles.dragHandle,
                  isDragging && styles.dragHandleActive,
                ]}
                {...panResponder.panHandlers}
              >
                <Ionicons
                  name="reorder-three"
                  size={22}
                  color={isDragging ? "#7C83FD" : "rgba(255,255,255,0.3)"}
                />
              </Animated.View>
            </Animated.View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dragModeHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginHorizontal: 16, marginBottom: 8, backgroundColor: "#1A1A2E",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "#7C83FD33",
  },
  dragModeInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  dragModeTitle: { fontSize: 14, fontWeight: "700", color: "#7C83FD" },
  doneBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#7C83FD", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  doneBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  dragHint: { fontSize: 12, color: "#4A4A6A", textAlign: "center", marginBottom: 12 },
  listContent: { paddingHorizontal: 12 },
  itemContainer: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 8, gap: 8,
  },
  itemHover: {
    borderTopWidth: 2,
    borderTopColor: "#7C83FD",
    marginTop: -2,
  },
  indexBadge: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center", backgroundColor: "#1A1A2E",
  },
  indexText: { fontSize: 11, fontWeight: "800" },
  card: {
    flex: 1, flexDirection: "row", borderRadius: 14,
    overflow: "hidden", minHeight: ITEM_HEIGHT - 8,
  },
  cardDragging: {
    shadowColor: "#7C83FD", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 12,
    opacity: 0.95,
  },
  accentBar: { width: 3, margin: 8, marginRight: 0, borderRadius: 2 },
  cardContent: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", flex: 1, letterSpacing: -0.2 },
  badges: { flexDirection: "row", alignItems: "center", gap: 5 },
  imageBadge: {
    flexDirection: "row", alignItems: "center", gap: 2,
    backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6,
  },
  imageBadgeText: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  cardPreview: { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 16 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  tagPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  tagText: { fontSize: 10, fontWeight: "600" },
  dateText: { fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: "500" },
  dragHandle: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#1A1A2E",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A3E",
  },
  dragHandleActive: { backgroundColor: "#7C83FD22", borderColor: "#7C83FD55" },
});