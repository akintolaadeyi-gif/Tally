import { Linking, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Button, ScreenHeader, s } from "@/components/ui";
import { naira, shortDate } from "@/lib/format";
import { debts, type Debt } from "@/lib/ledger";
import { addEntry, useEntries } from "@/lib/store";
import { c, f } from "@/lib/theme";
import { router } from "expo-router";

function remind(d: Debt) {
  const text = `Good day ${d.customer}, this is a friendly reminder from my shop. You have a balance of ${naira(d.owed)}${d.dueDate ? ` that was due ${shortDate(d.dueDate)}` : ""}. Thank you!`;
  Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

function markPaid(d: Debt) {
  addEntry({
    type: "payment", item: "", quantity: null, unit: null, amount: d.owed, party: d.customer,
    payment: "cash", dueDate: null, transcript: `Marked as paid: ${d.customer}, ${naira(d.owed)}`,
  });
}

export default function DebtsScreen() {
  const list = debts(useEntries());
  const total = list.reduce((sum, d) => sum + d.owed, 0);
  const overdue = list.filter((d) => d.daysOverdue > 0).length;

  return (
    <Screen footer={<Button label="See my business record" kind="outline" onPress={() => router.push("/business")} />}>
      <ScreenHeader title="Who owes me" />
      <View style={st.summary}>
        <Text style={st.sumLabel}>Total owed to you</Text>
        <Text style={st.sumValue}>{naira(total)}</Text>
        <Text style={st.sumLabel}>{list.length} {list.length === 1 ? "customer" : "customers"} · {overdue} overdue</Text>
      </View>
      {list.length === 0 ? (
        <View style={s.card}><Text style={s.body}>Nobody owes you money right now.</Text></View>
      ) : (
        list.map((d) => (
          <View key={d.customer} style={st.item}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ gap: 2 }}>
                <Text style={s.rowTitle}>{d.customer}</Text>
                {d.daysOverdue > 0 ? (
                  <Text style={st.overdue}>{d.daysOverdue} {d.daysOverdue === 1 ? "day" : "days"} overdue</Text>
                ) : (
                  <Text style={s.rowSub}>{d.dueDate ? `Due ${shortDate(d.dueDate)}` : "No date set"}</Text>
                )}
              </View>
              <Text style={[s.rowTitle, { fontSize: 16 }]}>{naira(d.owed)}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button label="Send reminder" onPress={() => remind(d)} style={st.smallBtn} />
              <Button label="Mark as paid" kind="secondary" onPress={() => markPaid(d)} style={[st.smallBtn, { minHeight: 44 }]} />
            </View>
          </View>
        ))
      )}
      <Text style={s.muted}>Reminders open WhatsApp with a polite message ready to send. Voice-note reminders in your own language come next.</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  summary: { backgroundColor: c.amberBg, borderRadius: 20, padding: 18, gap: 6 },
  sumLabel: { fontFamily: f.regular, fontSize: 13, color: c.amberInk },
  sumValue: { fontFamily: f.display, fontSize: 34, color: c.amberDeep },
  item: { backgroundColor: c.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  overdue: { fontFamily: f.semibold, fontSize: 13, color: c.overdue },
  smallBtn: { flex: 1, minHeight: 44, borderRadius: 12 },
});
