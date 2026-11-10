import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";
import { naira, time } from "@/lib/format";
import { c, f } from "@/lib/theme";
import type { Entry } from "@/lib/types";

export function MicIcon({ size = 36, color = c.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={9} y={2} width={6} height={12} rx={3} />
      <Path d="M5 10a7 7 0 0 0 14 0" />
      <Line x1={12} y1={17} x2={12} y2={22} />
    </Svg>
  );
}

export function StopIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill={c.white}>
      <Rect x={6} y={6} width={12} height={12} rx={2} />
    </Svg>
  );
}

export function LockIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={11} width={16} height={10} rx={2} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Svg>
  );
}

export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={s.header}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={s.back}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 18l-6-6 6-6" />
        </Svg>
      </Pressable>
      <Text style={s.headerTitle} accessibilityRole="header">{title}</Text>
    </View>
  );
}

const TAGS = {
  credit: [c.amberBg, c.amberInk],
  transfer: [c.greenSoft, c.greenDeep],
  cash: [c.greenSoft, c.greenDeep],
  stock: [c.stone, c.ink2],
  paid: [c.greenSoft, c.greenDeep],
} as const;

export function Tag({ kind, label }: { kind: keyof typeof TAGS; label: string }) {
  const [bg, fg] = TAGS[kind];
  return (
    <View style={[s.tag, { backgroundColor: bg }]}>
      <Text style={[s.tagText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function describe(e: Entry): string {
  if (e.type === "payment") return "Paid back";
  const qty = e.quantity ? `${e.quantity} ${e.unit ?? ""} of `.replace("  ", " ") : "";
  const what = `${qty}${e.item || "goods"}`;
  return e.type === "purchase" ? `Bought: ${what}` : what.charAt(0).toUpperCase() + what.slice(1);
}

export function EntryRow({ e }: { e: Entry }) {
  const who = e.party ?? (e.type === "sale" ? "Walk-in" : "");
  const signed = e.type === "purchase" ? -e.amount : e.amount;
  const tag =
    e.type === "purchase" ? <Tag kind="stock" label="Stock" />
    : e.type === "payment" ? <Tag kind="paid" label="Payment" />
    : e.payment === "credit" ? <Tag kind="credit" label="Credit" />
    : <Tag kind={e.payment} label={e.payment === "cash" ? "Cash" : "Transfer"} />;
  return (
    <View style={s.row}>
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{describe(e)}</Text>
        <Text style={s.rowSub}>{[who, time(e.createdAt)].filter(Boolean).join(" · ")}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={s.rowTitle}>{naira(signed)}</Text>
        {tag}
      </View>
    </View>
  );
}

export function Button({
  label, onPress, kind = "primary", disabled, style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "outline" | "link";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, s[kind], pressed && { opacity: 0.85 }, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={[s.btnText, kind === "primary" ? { color: c.white } : kind === "secondary" ? { color: c.ink } : { color: c.green }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: f.display, fontSize: 20, color: c.ink },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: f.semibold, fontSize: 11 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowTitle: { fontFamily: f.semibold, fontSize: 15, color: c.ink },
  rowSub: { fontFamily: f.regular, fontSize: 13, color: c.muted },
  btn: { minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primary: { backgroundColor: c.green, minHeight: 56, borderRadius: 16 },
  secondary: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  outline: { borderWidth: 1, borderColor: c.green, minHeight: 52, borderRadius: 16 },
  link: { minHeight: 44 },
  btnText: { fontFamily: f.semibold, fontSize: 15 },
  card: { backgroundColor: c.white, borderRadius: 20, padding: 18 },
  h2: { fontFamily: f.semibold, fontSize: 15, color: c.ink },
  body: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.ink2 },
  muted: { fontFamily: f.regular, fontSize: 13, color: c.muted },
});
