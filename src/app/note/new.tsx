// app/note/new.tsx
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useNotes } from "../../context/NotesContext";
import { NOTE_COLORS, PREDEFINED_TAGS, NoteColor, NoteTag, NoteImage } from "../../types";
import { ImageViewer } from "../../components/ImageViewer";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const IMG_SIZE = (width - 40 - 8 * 2) / 3;

export default function NewNoteScreen() {
  const { addNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState<NoteColor>(NOTE_COLORS[0]);
  const [selectedTags, setSelectedTags] = useState<NoteTag[]>([]);
  const [images, setImages] = useState<NoteImage[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para agregar imágenes.");
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

  const removeImage = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const toggleTag = (tag: NoteTag) => {
    Haptics.selectionAsync();
    setSelectedTags((prev) =>
      prev.find((t) => t.id === tag.id) ? prev.filter((t) => t.id !== tag.id) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && images.length === 0) {
      Alert.alert("Nota vacía", "Agrega contenido antes de guardar.");
      return;
    }
    setIsSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addNote(title.trim() || "Sin título", content.trim(), selectedColor, selectedTags, images);
    router.back();
  };

  const handleDiscard = () => {
    if (title.trim() || content.trim() || images.length > 0) {
      Alert.alert("Descartar nota", "¿Seguro que quieres descartar?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: selectedColor }]} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleDiscard}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Nota</Text>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextInput
            style={styles.titleInput}
            placeholder="Título..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            multiline
          />
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

          {/* Imágenes */}
          {(images.length > 0 || true) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Imágenes</Text>
              <View style={styles.imagesGrid}>
                {images.map((img, i) => (
                  <TouchableOpacity
                    key={img.id}
                    style={styles.imageThumbnail}
                    onPress={() => { setViewerIndex(i); setViewerVisible(true); }}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: img.uri }} style={styles.thumbnailImg} contentFit="cover" />
                    <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(img.id)}>
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.addImageText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color de nota</Text>
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

          {/* Tags */}
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

          <View style={{ height: 60 }} />
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7C83FD", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  titleInput: { fontSize: 26, fontWeight: "800", color: "#FFFFFF", marginTop: 12, marginBottom: 16, padding: 0, letterSpacing: -0.5 },
  contentInput: { fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 24, minHeight: 140, padding: 0, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },

  // Images
  imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imageThumbnail: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 12, overflow: "hidden" },
  thumbnailImg: { width: "100%", height: "100%" },
  removeImgBtn: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 10 },
  addImageBtn: { width: IMG_SIZE, height: IMG_SIZE, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4 },
  addImageText: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: "500" },

  colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  colorDotSelected: { borderColor: "rgba(255,255,255,0.7)", transform: [{ scale: 1.15 }] },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  tagDot: { width: 7, height: 7, borderRadius: 4 },
  tagText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
});