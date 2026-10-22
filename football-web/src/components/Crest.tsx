import { useState } from "react";

interface Props {
  src: string;
  name: string;
  size?: "sm" | "md";
}

/** Club/league badge with a letter fallback when the logo fails to load. */
export function Crest({ src, name, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const className = `crest crest-${size}`;

  if (src === "" || failed) {
    return (
      <span className={`${className} crest-fallback`} aria-hidden="true">
        {name.slice(0, 1).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
