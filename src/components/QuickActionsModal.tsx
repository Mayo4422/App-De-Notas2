// components/QuickActionsModal.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotes } from "../context/NotesContext";
import { Note, ACCENT_COLORS } from "../types";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

type Props = {
  note: Note | null;
  visible: boolean;
  onClose: () => void;
};

type Action = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  danger?: boolean;
};

export function QuickActionsModal({ note, visible, onClose }: Props) {
  const { togglePin, toggleFavorite, deleteNote, addNote } = useNotes();
  const slideAnim = useRef(new Animated.Value(500)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 5,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 18,
          bounciness: 5,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 500,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnim, {
          toValue: 0.88,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!note) return null;

  const accentColor = ACCENT_COLORS[note.color];

  const actions: Action[] = [
    {
      id: "edit",
      label: "Editar nota",
      icon: "pencil",
      color: "#7C83FD",
    },
    {
      id: "pin",
      label: note.isPinned ? "Desfijar nota" : "Fijar nota",
      icon: note.isPinned ? "pin-outline" : "pin",
      color: accentColor,
    },
    {
      id: "favorite",
      label: note.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos",
      icon: note.isFavorite ? "heart-dislike" : "heart",
      color: "#EE4540",
    },
    {
      id: "duplicate",
      label: "Duplicar nota",
      icon: "copy-outline",
      color: "#06D6A0",
    },
    {
      id: "delete",
      label: "Eliminar nota",
      icon: "trash-outline",
      color: "#EE4540",
      danger: true,
    },
  ];

  const handleAction = (actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (actionId) {
      case "edit":
        onClose();
        setTimeout(() => router.push(`/note/${note.id}`), 250);
        break;

      case "pin":
        togglePin(note.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        break;

      case "favorite":
        toggleFavorite(note.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        break;

      case "duplicate":
        onClose();
        setTimeout(async () => {
          await addNote(
            `${note.title} (copia)`,
            note.content,
            note.color,
            note.tags
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 250);
        break;

      case "delete":
        onClose();
        setTimeout(() => {
          Alert.alert(
            "Eliminar nota",
            `¿Eliminar "${note.title}"?\nEsta acción no se puede deshacer.`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: () => {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning
                  );
                  deleteNote(note.id);
                },
              },
            ]
          );
        }, 300);
        break;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Preview de la nota */}
        <Animated.View
          style={[
            styles.notePreview,
            { backgroundColor: note.color, transform: [{ scale: cardAnim }] },
          ]}
        >
          <View style={styles.previewHeader}>
            <View style={[styles.previewDot, { backgroundColor: accentColor }]} />
            <View style={styles.previewBadges}>
              {note.isPinned && (
                <View style={styles.badge}>
                  <Ionicons name="pin" size={11} color={accentColor} />
                  <Text style={[styles.badgeText, { color: accentColor }]}>
                    Fijada
                  </Text>
                </View>
              )}
              {note.isFavorite && (
                <View style={styles.badge}>
                  <Ionicons name="heart" size={11} color="#EE4540" />
                  <Text style={[styles.badgeText, { color: "#EE4540" }]}>
                    Favorita
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.previewTitle} numberOfLines={1}>
            {note.title}
          </Text>

          {note.content.length > 0 && (
            <Text style={styles.previewContent} numberOfLines={2}>
              {note.content}
            </Text>
          )}

          {note.tags.length > 0 && (
            <View style={styles.previewTags}>
              {note.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag.id}
                  style={[
                    styles.previewTag,
                    {
                      backgroundColor: tag.color + "22",
                      borderColor: tag.color + "55",
                    },
                  ]}
                >
                  <Text style={[styles.previewTagText, { color: tag.color }]}>
                    {tag.label}
                  </Text>
                </View>
              ))}
              {note.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{note.tags.length - 3}</Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Lista de acciones */}
        <View style={styles.actionsContainer}>
          {actions.map((action) => (
            <React.Fragment key={action.id}>
              {action.id === "delete" && <View style={styles.separator} />}
              <TouchableOpacity
                style={[
                  styles.actionItem,
                  action.danger && styles.actionItemDanger,
                ]}
                onPress={() => handleAction(action.id)}
                activeOpacity={0.65}
              >
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: action.color + "1A" },
                  ]}
                >
                  <Ionicons name={action.icon} size={19} color={action.color} />
                </View>

                <Text
                  style={[
                    styles.actionLabel,
                    action.danger && styles.actionLabelDanger,
                  ]}
                >
                  {action.label}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={action.danger ? "#EE454050" : "#2A2A4A"}
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* Cancelar */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#13131C",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#2A2A3E",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#2A2A3E",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },

  // Preview
  notePreview: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    gap: 6,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewBadges: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  previewContent: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
  },
  previewTags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
    alignItems: "center",
  },
  previewTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  moreTagsText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
  },

  // Actions
  actionsContainer: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A3E",
    marginBottom: 10,
  },
  separator: {
    height: 6,
    backgroundColor: "#0D0D16",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  actionItemDanger: {
    borderBottomWidth: 0,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#D0D0F0",
  },
  actionLabelDanger: {
    color: "#EE4540",
  },

  // Cancel
  cancelBtn: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6060A0",
  },
});