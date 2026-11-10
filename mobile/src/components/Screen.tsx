import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { c } from "@/lib/theme";

/** A phone screen: scrolling content plus an optional footer pinned to the bottom. */
export function Screen({ children, footer, gap = 18 }: { children: ReactNode; footer?: ReactNode; gap?: number }) {
  return (
    <SafeAreaView style={st.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[st.content, { gap }]} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={st.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.ground },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8, gap: 10 },
});
