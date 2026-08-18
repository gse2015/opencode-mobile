import { useMemo, useCallback } from "react"
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet"
import { useTranslation } from "react-i18next"
import type { ForkableMessage } from "../../lib/session-ops"

export type { ForkableMessage }

interface Props {
  messages: ForkableMessage[]
  isDark: boolean
  sheetRef: React.RefObject<BottomSheet | null>
  onSelect: (messageID: string) => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  if (sameDay) return `${hh}:${mm}`
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

export function ForkPicker({ messages, isDark, sheetRef, onSelect }: Props) {
  const { t } = useTranslation()

  // Newest first — the most likely fork point is near the end.
  const sorted = useMemo(() => [...messages].sort((a, b) => b.time - a.time), [messages])

  const handleSelect = useCallback(
    (messageID: string) => {
      onSelect(messageID)
      sheetRef.current?.close()
    },
    [onSelect, sheetRef],
  )

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["45%", "75%"]}
      // See DirectoryBrowserSheet.tsx for why this is required alongside
      // static snapPoints (issue #104): without it the sheet can never open.
      enableDynamicSizing={false}
      enablePanDownToClose
      backgroundStyle={isDark ? s.sheetDark : s.sheet}
      handleIndicatorStyle={{ backgroundColor: isDark ? "#666666" : "#cccccc" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
    >
      <View style={s.header}>
        <Text style={[s.title, isDark && s.textWhite]}>{t("session.forkSheet.title")}</Text>
        <Text style={[s.subtitle, isDark && s.metaDark]}>{t("session.forkSheet.subtitle")}</Text>
      </View>
      {sorted.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="git-branch-outline" size={28} color={isDark ? "#555555" : "#cccccc"} />
          <Text style={[s.emptyText, isDark && s.metaDark]}>{t("session.forkSheet.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.content}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.row, isDark && s.rowDark]}
              onPress={() => handleSelect(item.id)}
              testID={`fork-option-${item.id}`}
            >
              <View style={s.rowText}>
                <Text style={[s.rowPreview, isDark && s.textWhite]} numberOfLines={2}>
                  {item.text || `(${t("session.forkSheet.noText")})`}
                </Text>
                <Text style={[s.rowTime, isDark && s.metaDark]}>{formatTime(item.time)}</Text>
              </View>
              <Ionicons name="git-branch-outline" size={18} color="#8b5cf6" />
            </TouchableOpacity>
          )}
        />
      )}
    </BottomSheet>
  )
}

const s = StyleSheet.create({
  sheet: { backgroundColor: "#ffffff" },
  sheetDark: { backgroundColor: "#1a1a1a" },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  title: { fontSize: 18, fontWeight: "700", color: "#0a0a0a" },
  subtitle: { fontSize: 13, color: "#999999" },
  textWhite: { color: "#ffffff" },
  metaDark: { color: "#666666" },
  content: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
    gap: 12,
  },
  rowDark: { borderBottomColor: "#2a2a2a" },
  rowText: { flex: 1 },
  rowPreview: { fontSize: 14, fontWeight: "500", color: "#0a0a0a" },
  rowTime: { fontSize: 12, color: "#999999", marginTop: 3 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, color: "#999999" },
})
