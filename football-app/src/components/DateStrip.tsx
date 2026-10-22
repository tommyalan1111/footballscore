import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { addDays, toDateKey } from "../dates";
import { useTheme } from "../theme";

interface Props {
  selected: Date;
  onSelect: (date: Date) => void;
}

const DAYS_BEFORE = 3;
const DAYS_AFTER = 3;

export function DateStrip({ selected, onSelect }: Props) {
  const t = useTheme();
  const todayKey = toDateKey(new Date());

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) =>
      addDays(today, i - DAYS_BEFORE),
    );
    // Recompute only when the calendar day changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

  const selectedKey = toDateKey(selected);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {days.map((d) => {
        const key = toDateKey(d);
        const active = key === selectedKey;
        const weekday =
          key === todayKey ? "Today" : d.toLocaleDateString([], { weekday: "short" });
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(d)}
            style={[
              styles.chip,
              { backgroundColor: active ? t.accent : t.card },
            ]}
          >
            <Text style={[styles.weekday, { color: active ? t.onAccent : t.subtext }]}>
              {weekday}
            </Text>
            <Text style={[styles.day, { color: active ? t.onAccent : t.text }]}>
              {d.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    minWidth: 56,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  weekday: { fontSize: 12, fontWeight: "600" },
  day: { fontSize: 16, fontWeight: "700", marginTop: 2 },
});
