// app/note/new.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNotes } from "../../context/NotesContext";
import { NOTE_COLORS, PREDEFINED_TAGS, NoteColor, NoteTag } from "../../types";
import * as Haptics from "expo-haptics";

export default function NewNoteScreen() {
  const { addNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>(NOTE_COLORS[0]);
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tag: NoteTag) => {
    Haptics.selectionAsync();
    setSelectedTags((prev) =>
      prev.find((t) => t.id === tag.id)
        ? prev.filter((t) => t.id !== tag.id)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert("Nota vacía", "Agrega un título o contenido antes de guardar.");
      return;
    }
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addNote(
      title.trim() || "Sin título",
      content.trim(),
      selectedColor,
      selectedTags
    );
    router.back();
  };

  const handleDiscard = () => {
    if (title.trim() || content.trim()) {
      Alert.alert("Descartar nota", "¿Seguro que quieres descartar esta nota?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: selectedColor }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleDiscard}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Nota</Text>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="Título..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            multiline
            returnKeyType="next"
          />

          {/* Content */}
          <TextInput
            style={styles.contentInput}
            placeholder="Escribe tu nota aquí..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Color Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color de nota</Text>
            <View style={styles.colorRow}>
              {NOTE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorDotSelected,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedColor(color);
                  }}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etiquetas</Text>
            <View style={styles.tagsRow}>
              {PREDEFINED_TAGS.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      isSelected && {
                        backgroundColor: tag.color + "33",
                        borderColor: tag.color,
                      },
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <View
                      style={[
                        styles.tagDot,
                        { backgroundColor: tag.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && { color: tag.color },
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#7C83FD",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 16,
    padding: 0,
    letterSpacing: -0.5,
  },
  contentInput: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
    minHeight: 180,
    padding: 0,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: {
    borderColor: "rgba(255,255,255,0.7)",
    transform: [{ scale: 1.15 }],
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
});