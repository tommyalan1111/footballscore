import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DateStrip } from "./src/components/DateStrip";
import { MatchRow } from "./src/components/MatchRow";
import { useTheme } from "./src/theme";
import { useMatches } from "./src/useMatches";

function ScoresScreen() {
  const t = useTheme();
  const [date, setDate] = useState(() => new Date());
  const { sections, liveCount, loading, refreshing, error, stale, refresh } = useMatches(date);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: t.bg }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Scores</Text>
        {liveCount > 0 && (
          <View style={[styles.liveBadge, { backgroundColor: t.live }]}>
            <Text style={styles.liveBadgeText}>{liveCount} LIVE</Text>
          </View>
        )}
      </View>

      <DateStrip selected={date} onSelect={setDate} />

      {error && (
        <Pressable onPress={refresh} style={[styles.banner, { backgroundColor: t.card }]}>
          <Text style={{ color: t.live }}>
            {error}. Tap to retry.
          </Text>
        </Pressable>
      )}
      {!error && stale && (
        <View style={[styles.banner, { backgroundColor: t.card }]}>
          <Text style={{ color: t.subtext }}>Showing older data. Updating soon.</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={t.accent} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(m) => String(m.id)}
          renderItem={({ item }) => <MatchRow match={item} />}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: t.card }]}>
              <Image source={{ uri: section.logo }} style={styles.leagueLogo} />
              <Text style={[styles.sectionTitle, { color: t.text }]} numberOfLines={1}>
                {section.title}
              </Text>
            </View>
          )}
          stickySectionHeadersEnabled
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: t.subtext }]}>
              {error ? "Could not load matches." : "No matches on this day."}
            </Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ScoresScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: { fontSize: 28, fontWeight: "800" },
  liveBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  liveBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  banner: { marginHorizontal: 16, marginBottom: 6, padding: 10, borderRadius: 10 },
  loader: { marginTop: 40 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leagueLogo: { width: 18, height: 18, resizeMode: "contain" },
  sectionTitle: { flex: 1, fontSize: 13, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 15 },
  listContent: { paddingBottom: 32 },
});
