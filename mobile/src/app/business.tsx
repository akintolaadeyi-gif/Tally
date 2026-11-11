import { StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { LockIcon, ScreenHeader, s } from "@/components/ui";
import { naira } from "@/lib/format";
import { businessRecord, RECORD_GOAL_DAYS } from "@/lib/ledger";
import { useEntries } from "@/lib/store";
import { c, f } from "@/lib/theme";

const UNLOCKS = [
  { day: 60, title: "Stock now, pay later", body: "Your suppliers can see you sell steadily and give you goods on credit." },
  { day: 90, title: "Small business loan", body: "Partner lenders offer loans based on your real sales, not paperwork." },
];

export default function BusinessScreen() {
  const r = businessRecord(useEntries());
  const pct = Math.min(100, Math.round((r.daysRecorded / RECORD_GOAL_DAYS) * 100));

  return (
    <Screen
      footer={
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <LockIcon />
          <Text style={[s.body, { flex: 1 }]}>Your record stays on this phone. Nobody sees it unless you choose to share it.</Text>
        </View>
      }
    >
      <ScreenHeader title="My business record" />
      <View style={[s.card, { gap: 12 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={s.h2}>Days recorded</Text>
          <Text style={st.days}>{r.daysRecorded} <Text style={s.muted}>of {RECORD_GOAL_DAYS}</Text></Text>
        </View>
        <View style={st.track} accessibilityLabel={`${r.daysRecorded} of ${RECORD_GOAL_DAYS} days recorded`}>
          <View style={[st.fill, { width: `${pct}%` }]} />
        </View>
        <Text style={s.body}>
          {r.daysRecorded >= RECORD_GOAL_DAYS
            ? "Your record is strong enough to show a lender or supplier."
            : `Keep recording every day. At ${RECORD_GOAL_DAYS} days your record is strong enough to show a lender or supplier.`}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={st.stat}>
          <Text style={st.statLabel}>Average weekly sales</Text>
          <Text style={st.statValue}>{r.weeklySales === null ? "—" : naira(r.weeklySales)}</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statLabel}>Customers who paid on time</Text>
          <Text style={st.statValue}>{r.onTimeRate === null ? "—" : `${Math.round(r.onTimeRate * 100)}%`}</Text>
        </View>
      </View>
      <Text style={s.h2}>What your record can unlock</Text>
      {UNLOCKS.map((u) => {
        const ready = r.daysRecorded >= u.day;
        return (
          <View key={u.title} style={[s.card, { borderRadius: 16, padding: 16, gap: 6 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={s.rowTitle}>{u.title}</Text>
              <View style={[st.pill, ready && { backgroundColor: c.greenSoft }]}>
                <Text style={[st.pillText, ready && { color: c.greenDeep }]}>{ready ? "Ready" : `Day ${u.day}`}</Text>
              </View>
            </View>
            <Text style={s.muted}>{u.body}</Text>
          </View>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  days: { fontFamily: f.display, fontSize: 22, color: c.ink },
  track: { height: 10, borderRadius: 5, backgroundColor: c.stone },
  fill: { height: 10, borderRadius: 5, backgroundColor: c.green },
  stat: { flex: 1, backgroundColor: c.white, borderRadius: 16, padding: 14, gap: 4 },
  statLabel: { fontFamily: f.regular, fontSize: 12, color: c.muted },
  statValue: { fontFamily: f.semibold, fontSize: 18, color: c.ink },
  pill: { backgroundColor: c.stone, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontFamily: f.semibold, fontSize: 11, color: c.ink2 },
});
