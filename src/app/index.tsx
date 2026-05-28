// app/index.tsx
import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Pressable, Animated, Dimensions,
  ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNotes } from "../context/NotesContext";
import { NoteCard } from "../components/NoteCard";
import { SortModal } from "../components/SortModal";
import { DraggableNoteList } from "../components/DraggableNoteList";
import { PREDEFINED_TAGS } from "../types";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const {
    filteredNotes, viewMode, setViewMode,
    searchQuery, setSearchQuery,
    activeTagFilter, setTagFilter,
    isLoading, notes,
  } = useNotes();

  const [sortVisible, setSortVisible] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const onSearchFocus = () => {
    setSearchFocused(true);
    Animated.timing(searchAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const onSearchBlur = () => {
    setSearchFocused(false);
    Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const handleNewNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/note/new");
  };

  const toggleViewMode = () => {
    Haptics.selectionAsync();
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const enterDragMode = () => {
    // No permitir drag mode si hay búsqueda o filtro activo
    if (searchQuery || activeTagFilter) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDragMode(true);
  };

  const exitDragMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDragMode(false);
  };

  const searchBorderColor = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#2A2A3E", "#7C83FD"],
  });

  const canDrag = !searchQuery && !activeTagFilter && notes.length > 1;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#2A2A3E" />
      <Text style={styles.emptyTitle}>
        {searchQuery || activeTagFilter ? "Sin resultados" : "Sin notas aún"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || activeTagFilter
          ? "Intenta con otra búsqueda o filtro"
          : "Toca el botón + para crear tu primera nota"}
      </Text>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C83FD" />
        </View>
      );
    }

    // Modo drag & drop
    if (dragMode) {
      return <DraggableNoteList onExitDragMode={exitDragMode} />;
    }

    if (filteredNotes.length === 0) return renderEmpty();

    const numColumns = viewMode === "grid" ? 2 : 1;

    return (
      <FlatList
        key={viewMode}
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          filteredNotes.some((n) => n.isPinned) && !searchQuery ? (
            <Text style={styles.sectionLabel}>📌 Fijadas primero</Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <NoteCard
            note={item}
            viewMode={viewMode}
            index={index}
            onPress={() => router.push(`/note/${item.id}`)}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Notas</Text>
          <Text style={styles.headerSubtitle}>
            {notes.length} {notes.length === 1 ? "nota" : "notas"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Botón drag mode */}
          <TouchableOpacity
            style={[styles.iconBtn, canDrag && !dragMode && styles.iconBtnActive]}
            onPress={enterDragMode}
            disabled={!canDrag}
          >
            <Ionicons
              name="reorder-three-outline"
              size={20}
              color={canDrag ? "#7C83FD" : "#3A3A5A"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setSortVisible(true)}
          >
            <Ionicons name="funnel-outline" size={20} color="#9090B0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleViewMode}>
            <Ionicons
              name={viewMode === "grid" ? "list-outline" : "grid-outline"}
              size={20}
              color="#9090B0"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {!dragMode && (
        <Animated.View style={[styles.searchContainer, { borderColor: searchBorderColor }]}>
          <Ionicons name="search-outline" size={18} color={searchFocused ? "#7C83FD" : "#5A5A7A"} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar notas..."
            placeholderTextColor="#5A5A7A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#5A5A7A" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Tag Filters */}
      {!dragMode && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsScrollView}
          contentContainerStyle={styles.tagsContent}
        >
          <TouchableOpacity
            style={[styles.tagChip, !activeTagFilter && styles.tagChipActive]}
            onPress={() => setTagFilter(null)}
          >
            <Text style={[styles.tagChipText, !activeTagFilter && styles.tagChipTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {PREDEFINED_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tagChip,
                activeTagFilter === tag.id && { backgroundColor: tag.color + "33", borderColor: tag.color },
              ]}
              onPress={() => setTagFilter(activeTagFilter === tag.id ? null : tag.id)}
            >
              <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
              <Text style={[styles.tagChipText, activeTagFilter === tag.id && { color: tag.color }]}>
                {tag.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Drag mode: mostrar banner si hay filtros activos */}
      {!dragMode && canDrag === false && notes.length > 1 && (
        <View style={styles.dragDisabledBanner}>
          <Ionicons name="information-circle-outline" size={14} color="#5A5A7A" />
          <Text style={styles.dragDisabledText}>
            Limpia la búsqueda para reordenar
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* FAB — oculto en drag mode */}
      {!dragMode && (
        <Pressable style={styles.fab} onPress={handleNewNote}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}

      <SortModal visible={sortVisible} onClose={() => setSortVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#5A5A7A", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#1A1A2E",
    alignItems: "center", justifyContent: "center",
  },
  iconBtnActive: {
    backgroundColor: "#7C83FD1A",
    borderWidth: 1,
    borderColor: "#7C83FD44",
  },
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A2E",
    marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    gap: 10, borderWidth: 1.5, borderColor: "#2A2A3E", marginBottom: 14,
  },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 15, padding: 0 },
  tagsScrollView: { maxHeight: 44, marginBottom: 12 },
  tagsContent: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  tagChip: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#1A1A2E", borderWidth: 1, borderColor: "#2A2A3E",
    gap: 6, marginRight: 8,
  },
  tagChipActive: { backgroundColor: "#7C83FD22", borderColor: "#7C83FD" },
  tagChipText: { fontSize: 13, color: "#7070A0", fontWeight: "500" },
  tagChipTextActive: { color: "#7C83FD" },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  dragDisabledBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 20, marginBottom: 10,
  },
  dragDisabledText: { fontSize: 12, color: "#4A4A6A" },
  content: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 13, color: "#5A5A7A", fontWeight: "600",
    paddingHorizontal: 8, marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase",
  },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#4A4A6A" },
  emptySubtitle: { fontSize: 14, color: "#3A3A5A", textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  fab: {
    position: "absolute", bottom: 32, right: 24, width: 60, height: 60,
    borderRadius: 20, backgroundColor: "#7C83FD", alignItems: "center", justifyContent: "center",
    shadowColor: "#7C83FD", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 12,
  },
});