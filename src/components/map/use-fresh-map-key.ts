"use client";

import { useLayoutEffect, useState } from "react";

export function useFreshMapKey(): number {
  const [generation, setGeneration] = useState(0);
  useLayoutEffect(() => () => setGeneration((current) => current + 1), []);
  return generation;
}
