"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>Increment</Button>
      <Button onClick={() => setCount(count - 1)}>Decrement</Button>
    </div>
  );
}
