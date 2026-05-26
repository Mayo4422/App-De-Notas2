// components/SortModal.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotes } from "../context/NotesContext";
import { SortOption } from "../types";
import * as Haptics from "expo-haptics";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type SortItem = {
  value: SortOption;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SORT_OPTIONS: SortItem[] = [
  {
    value: "updatedAt",
    label: "Última modificación",
    description: "Las más recientes primero",
    icon: "time-outline",
  },
  {
    value: "createdAt",
    label: "Fecha de creación",
    description: "Las más nuevas primero",
    icon: "calendar-outline",
  },
  {
    value: "title",
    label: "Título",
    description: "Orden alfabético A → Z",
    icon: "text-outline",
  },
];

export function SortModal({ visible, onClose }: Props) {
  const { sortBy, setSortBy } = useNotes();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 4,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (value: SortOption) => {
    Haptics.selectionAsync();
    setSortBy(value);
    onClose();
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

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Ordenar notas</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#7070A0" />
          </TouchableOpacity>
        </View>

        {/* Options */}
        <View style={styles.optionsList}>
          {SORT_OPTIONS.map((option, index) => {
            const isSelected = sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                  index < SORT_OPTIONS.length - 1 && styles.optionItemBorder,
                ]}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.optionIcon,
                    isSelected && styles.optionIconSelected,
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? "#7C83FD" : "#5A5A7A"}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#7C83FD" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pinned note note */}
        <View style={styles.infoBox}>
          <Ionicons name="pin-outline" size={14} color="#5A5A7A" />
          <Text style={styles.infoText}>
            Las notas fijadas siempre aparecen primero
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#16161F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#2A2A3E",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#2A2A3E",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  optionsList: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionItemSelected: {
    backgroundColor: "#7C83FD11",
  },
  optionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#0F0F14",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: "#7C83FD1A",
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C0C0D8",
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },
  optionDesc: {
    fontSize: 12,
    color: "#5A5A7A",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  infoText: {
    fontSize: 12,
    color: "#5A5A7A",
    flex: 1,
  },
});