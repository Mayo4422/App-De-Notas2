// app/_layout.tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NotesProvider } from "../context/NotesContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotesProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#0F0F14" },
            animation: "fade_from_bottom",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="note/[id]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="note/new"
            options={{ animation: "slide_from_bottom" }}
          />
        </Stack>
      </NotesProvider>
    </GestureHandlerRootView>
  );
}