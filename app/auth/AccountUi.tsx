import type { ReactNode } from "react";
import styles from "./auth.module.css";

export { styles };

export function AccountCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.eyebrow}>YunChinese · Account</div>
        <h1 className={styles.title}>{title}</h1>
        {description ? <p className={styles.description}>{description}</p> : null}
        {children}
      </section>
    </main>
  );
}

export function AccountField({ name, label, type, minLength, maxLength, autoComplete }: {
  name: string; label: string; type: "email" | "password";
  minLength?: number; maxLength?: number; autoComplete: string;
}) {
  return <div className={styles.field}>
    <label htmlFor={name} className={styles.label}>{label}</label>
    <input id={name} name={name} type={type} autoComplete={autoComplete}
      minLength={minLength} maxLength={maxLength} required className={styles.input} />
  </div>;
}
