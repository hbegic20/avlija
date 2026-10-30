export type FavoritesSnapshot = {
  status: "unknown" | "guest" | "ready";
  ids: ReadonlySet<string>;
};

const unknownSnapshot: FavoritesSnapshot = { status: "unknown", ids: new Set() };

let snapshot: FavoritesSnapshot = unknownSnapshot;
const listeners = new Set<() => void>();

function publish(next: FavoritesSnapshot) {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

export const favoritesStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): FavoritesSnapshot {
    return snapshot;
  },
  getServerSnapshot(): FavoritesSnapshot {
    return unknownSnapshot;
  },
  hydrate(loggedIn: boolean, ids: readonly string[]) {
    publish({ status: loggedIn ? "ready" : "guest", ids: new Set(ids) });
  },
  set(listingId: string, favorite: boolean) {
    const ids = new Set(snapshot.ids);
    if (favorite) {
      ids.add(listingId);
    } else {
      ids.delete(listingId);
    }
    publish({ ...snapshot, ids });
  },
};
