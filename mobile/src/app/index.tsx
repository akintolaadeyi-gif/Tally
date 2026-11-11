import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Button, EntryRow, MicIcon, s } from "@/components/ui";
import { naira } from "@/lib/format";
import { greeting } from "@/lib/greeting";
import { todaySummary } from "@/lib/ledger";
import { sampleEntries } from "@/lib/sample";
import { useLanguage } from "@/lib/settings";
import { replaceAll, useEntries } from "@/lib/store";
import { c, f } from "@/lib/theme";

export default function Home() {
  const entries = useEntries();
  const [language] = useLanguage();
  const today = todaySummary(entries);
  const recent = entries.slice(0, 3);
  const dateLabel = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" });

  return (
    <Screen
      gap={20}
      footer={
        <View style={{ alignItems: "center", gap: 10 }}>
          <Pressable
            onPress={() => router.push("/record")}
            accessibilityRole="button"
            accessibilityLabel="Speak a sale"
            style={({ pressed }) => [st.mic, pressed && { backgroundColor: c.greenDeep }]}
          >
            <MicIcon />
          </Pressable>
          <Text style={[s.body, { fontSize: 14 }]}>Tap and say what you sold</Text>
        </View>
      }
    >
      <View style={{ gap: 2 }}>
        <Text style={s.muted}>{dateLabel}</Text>
        <Text style={st.greeting} accessibilityRole="header">{greeting(language)}</Text>
      </View>

      <View style={st.hero} accessibilityLabel={`Today's sales ${naira(today.total)}`}>
        <Text style={st.heroLabel}>Today&apos;s sales</Text>
        <Text style={st.heroValue}>{naira(today.total)}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={st.heroBox}>
            <Text style={st.heroBoxLabel}>Cash and transfer</Text>
            <Text style={st.heroBoxValue}>{naira(today.paid)}</Text>
          </View>
          <View style={st.heroBox}>
            <Text style={st.heroBoxLabel}>On credit</Text>
            <Text style={st.heroBoxValue}>{naira(today.credit)}</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.h2}>Recent</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Link href="/business" style={st.link}>My record</Link>
            <Link href="/debts" style={st.link}>Who owes me</Link>
          </View>
        </View>
        {recent.length ? (
          recent.map((e) => <EntryRow key={e.id} e={e} />)
        ) : (
          <View style={[st.empty]}>
            <Text style={s.body}>
              Nothing recorded yet. Tap the mic and say a sale, like “I sell two bag rice to Mama Tunde, 12k, she go pay Friday.”
            </Text>
            <Button label="Load sample data" kind="secondary" onPress={() => replaceAll(sampleEntries())} style={{ alignSelf: "flex-start" }} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  greeting: { fontFamily: f.bold, fontSize: 24, color: c.ink },
  hero: { backgroundColor: c.green, borderRadius: 20, padding: 20, gap: 14 },
  heroLabel: { fontFamily: f.regular, fontSize: 13, color: "rgba(255,255,255,0.85)" },
  heroValue: { fontFamily: f.display, fontSize: 40, color: c.white },
  heroBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, gap: 4 },
  heroBoxLabel: { fontFamily: f.regular, fontSize: 12, color: "rgba(255,255,255,0.85)" },
  heroBoxValue: { fontFamily: f.semibold, fontSize: 18, color: c.white },
  link: { fontFamily: f.semibold, fontSize: 14, color: c.green, paddingVertical: 12 },
  empty: { backgroundColor: c.white, borderRadius: 16, padding: 16, gap: 12 },
  mic: { width: 88, height: 88, borderRadius: 44, backgroundColor: c.green, alignItems: "center", justifyContent: "center", shadowColor: c.green, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
