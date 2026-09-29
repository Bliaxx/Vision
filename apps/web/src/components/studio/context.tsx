'use client';

import type { Draft } from '@dedale/contracts';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { useStore } from 'zustand';
import { createEditorStore, type EditorActions, type EditorState, type EditorStore } from './store';

const EditorContext = createContext<EditorStore | null>(null);

export function EditorProvider({ draft, children }: { draft: Draft; children: ReactNode }) {
  const [store] = useState(() => createEditorStore(draft));
  return <EditorContext.Provider value={store}>{children}</EditorContext.Provider>;
}

/** Sélecteur typé sur l'état de l'éditeur (re-rendu minimal). */
export function useEditor<T>(selector: (state: EditorState & EditorActions) => T): T {
  const store = useContext(EditorContext);
  if (!store) throw new Error('useEditor doit être utilisé dans <EditorProvider>');
  return useStore(store, selector);
}

export function useEditorStore(): EditorStore {
  const store = useContext(EditorContext);
  if (!store) throw new Error('useEditorStore doit être utilisé dans <EditorProvider>');
  return store;
}
