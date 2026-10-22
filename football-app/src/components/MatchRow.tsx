import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { isLive, statusLabel } from "../status";
import { useTheme } from "../theme";
import type { Match } from "../types";

function MatchRowImpl({ match }: { match: Match }) {
  const t = useTheme();
  const live = isLive(match);
  const { home, away } = match.score;
  const scoreColor = live ? t.live : t.text;

  return (
    <View style={[styles.row, { borderBottomColor: t.border }]}>
      <Text style={[styles.status, { color: live ? t.live : t.subtext }]}>
        {statusLabel(match)}
      </Text>

      <View style={styles.teams}>
        <View style={styles.teamLine}>
          <Image source={{ uri: match.home.logo }} style={styles.logo} />
          <Text style={[styles.teamName, { color: t.text }]} numberOfLines={1}>
            {match.home.name}
          </Text>
        </View>
        <View style={styles.teamLine}>
          <Image source={{ uri: match.away.logo }} style={styles.logo} />
          <Text style={[styles.teamName, { color: t.text }]} numberOfLines={1}>
            {match.away.name}
          </Text>
        </View>
      </View>

      <View style={styles.scores}>
        <Text style={[styles.score, { color: scoreColor }]}>{home ?? "-"}</Text>
        <Text style={[styles.score, { color: scoreColor }]}>{away ?? "-"}</Text>
      </View>
    </View>
  );
}

export const MatchRow = memo(MatchRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  status: { width: 52, fontSize: 13, fontWeight: "600" },
  teams: { flex: 1, gap: 6 },
  teamLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 20, height: 20, resizeMode: "contain" },
  teamName: { flex: 1, fontSize: 15 },
  scores: { width: 28, alignItems: "flex-end", gap: 6 },
  score: { fontSize: 15, fontWeight: "700" },
});
