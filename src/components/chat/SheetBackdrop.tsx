import { BottomSheetBackdrop, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet"

// Module-level (stable reference) backdrop for every sheet in this app.
//
// A `backdropComponent` whose identity changes on each render (e.g. an inline
// arrow in the sheet component body) makes React treat it as a NEW component
// type on every re-render, unmounting and remounting the backdrop subtree.
// Each remount resets the backdrop's internal `pointerEvents` state to 'auto'
// and re-rolls a mount race in @gorhom/bottom-sheet (its `useAnimatedReaction`
// first fire can be skipped by the `isMounted` guard it ships with, issue
// #1376); while the sheet stays closed `animatedIndex` never changes, so the
// reaction never re-fires and the backdrop stays 'auto' — a transparent
// full-area layer that swallows every touch above the keyboard.
//
// Keeping the reference stable at module level means the backdrop mounts once
// per sheet and its pointerEvents state ('none' closed / 'auto' open) survives
// all re-renders and keyboard events. The inner BottomSheetBackdrop is memo,
// so these re-renders bail out cheaply.
export function SheetBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
}
