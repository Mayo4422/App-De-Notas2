// app/note/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useNotes } from "../../context/NotesContext";
import { NOTE_COLORS, PREDEFINED_TAGS, NoteColor, NoteTag, NoteImage, ACCENT_COLORS } from "../../types";
import { ImageViewer } from "../../components/ImageViewer";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const IMG_SIZE = (width - 40 - 8 * 2) / 3;

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote, togglePin, toggleFavorite } = useNotes();
  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [selectedColor, setSelectedColor] = useState<NoteColor>(note?.color ?? NOTE_COLORS[0]);
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>(note?.tags ?? []);
  const [images, setImages] = useState<NoteImage[]>(note?.images ?? []);
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => { if (!note) router.back(); }, [note]);
  if (!note) return null;

  const accentColor = ACCENT_COLORS[selectedColor];
  const hasChanges =
    title !== note.title || content !== note.content ||
    selectedColor !== note.color ||
    JSON.stringify(selectedTags.map((t) => t.id).sort()) !== JSON.stringify(note.tags.map((t) => t.id).sort()) ||
    JSON.stringify(images.map((i) => i.id)) !== JSON.stringify((note.images ?? []).map((i: NoteImage) => i.id));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImgs: NoteImage[] = result.assets.map((a) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        uri: a.uri,
        width: a.width,
        height: a.height,
      }));
      setImages((prev) => [...prev, ...newImgs]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const removeImage = (imgId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const toggleTag = (tag: NoteTag) => {
    Haptics.selectionAsync();
    setSelectedTags((prev) =>
      prev.find((t) => t.id === tag.id) ? prev.filter((t) => t.id !== tag.id) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!hasChanges) { setIsEditing(false); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateNote({ ...note, title: title.trim() || "Sin título", content: content.trim(), color: selectedColor, tags: selectedTags, images });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert("Eliminar nota", "Esta acción no se puede deshacer. ¿Continuar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => { await deleteNote(note.id); router.back(); } },
    ]);
  };

  const handleBack = () => {
    if (hasChanges && isEditing) {
      Alert.alert("Cambios sin guardar", "¿Qué deseas hacer?", [
        { text: "Descartar", style: "destructive", onPress: () => router.back() },
        { text: "Guardar", onPress: handleSave },
        { text: "Cancelar", style: "cancel" },
      ]);
    } else {
      router.back();
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: selectedColor }]} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleBack}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => { Haptics.selectionAsync(); toggleFavorite(note.id); }}>
              <Ionicons name={note.isFavorite ? "heart" : "heart-outline"} size={20} color={note.isFavorite ? "#EE4540" : "#FFFFFF"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => { Haptics.selectionAsync(); togglePin(note.id); }}>
              <Ionicons name={note.isPinned ? "pin" : "pin-outline"} size={20} color={note.isPinned ? accentColor : "#FFFFFF"} />
            </TouchableOpacity>
            {isEditing ? (
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: accentColor }]} onPress={handleSave}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.headerBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowOptions(!showOptions)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dropdown opciones */}
        {showOptions && (
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowOptions(false); handleDelete(); }}>
              <Ionicons name="trash-outline" size={18} color="#EE4540" />
              <Text style={[styles.dropdownText, { color: "#EE4540" }]}>Eliminar nota</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.timestamp}>Actualizado: {formatDate(note.updatedAt)}</Text>

          <TextInput style={styles.titleInput} value={title} onChangeText={setTitle}
            placeholder="Título..." placeholderTextColor="rgba(255,255,255,0.3)" editable={isEditing} multiline />

          <TextInput style={styles.contentInput} value={content} onChangeText={setContent}
            placeholder="Sin contenido..." placeholderTextColor="rgba(255,255,255,0.25)"
            editable={isEditing} multiline textAlignVertical="top" />

          {/* Galería de imágenes */}
          {(images.length > 0 || isEditing) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Imágenes {images.length > 0 ? `(${images.length})` : ""}
              </Text>
              <View style={styles.imagesGrid}>
                {images.map((img, i) => (
                  <TouchableOpacity
                    key={img.id}
                    style={styles.imageThumbnail}
                    onPress={() => { setViewerIndex(i); setViewerVisible(true); }}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: img.uri }} style={styles.thumbnailImg} contentFit="cover" />
                    {isEditing && (
                      <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(img.id)}>
                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    {/* Indicador de zoom */}
                    {!isEditing && (
                      <View style={styles.zoomIndicator}>
                        <Ionicons name="expand-outline" size={12} color="rgba(255,255,255,0.7)" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {isEditing && (
                  <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.addImageText}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Tags en modo vista */}
          {!isEditing && note.tags.length > 0 && (
            <View style={styles.tagsDisplay}>
              {note.tags.map((tag) => (
                <View key={tag.id} style={[styles.tagBadge, { backgroundColor: tag.color + "22", borderColor: tag.color }]}>
                  <Text style={[styles.tagBadgeText, { color: tag.color }]}>{tag.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Opciones de edición */}
          {isEditing && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Color</Text>
                <View style={styles.colorRow}>
                  {NOTE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorDot, { backgroundColor: color }, selectedColor === color && styles.colorDotSelected]}
                      onPress={() => { Haptics.selectionAsync(); setSelectedColor(color); }}
                    >
                      {selectedColor === color && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Etiquetas</Text>
                <View style={styles.tagsRow}>
                  {PREDEFINED_TAGS.map((tag) => {
                    const isSelected = selectedTags.some((t) => t.id === tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.tagChip, isSelected && { backgroundColor: tag.color + "33", borderColor: tag.color }]}
                        onPress={() => toggleTag(tag)}
                      >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.tagText, isSelected && { color: tag.color }]}>{tag.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <ImageViewer
        images={images}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  dropdown: { position: "absolute", top: 72, right: 16, backgroundColor: "#1A1A2E", borderRadius: 12, paddingVertical: 6, zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10, minWidth: 180, borderWidth: 1, borderColor: "#2A2A3E" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  dropdownText: { fontSize: 14, fontWeight: "600" },
  scroll: { flex: 1, paddingHorizontal: 20 },
  timestamp: { fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4, marginBottom: 12 },
  titleInput: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginBottom: 16, padding: 0, letterSpacing: -0.5 },
  contentInput: { fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 24, minHeight: 140, padding: 0, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },

  // Images
  imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imageThumbnail: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 12, overflow: "hidden" },
  thumbnailImg: { width: "100%", height: "100%" },
  removeImgBtn: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10 },
  zoomIndicator: { position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 6, padding: 3 },
  addImageBtn: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addImageText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "500" },

  tagsDisplay: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  tagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagBadgeText: { fontSize: 12, fontWeight: "600" },
  colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  colorDotSelected: { borderColor: "rgba(255,255,255,0.7)", transform: [{ scale: 1.15 }] },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  tagText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
});