import type { ReactNode } from "react";

export function StaticPage({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="container">
      <article className="static-page">
        <span className="kicker">{kicker}</span>
        <h1>{title}</h1>
        {intro ? <p className="static-intro">{intro}</p> : null}
        <div className="static-body">{children}</div>
      </article>
    </div>
  );
}
