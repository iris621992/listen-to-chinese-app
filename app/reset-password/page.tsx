import { redirect } from "next/navigation";
import { updateLearnerPassword } from "@/app/auth/actions";
import { AccountCard, AccountField, styles } from "@/app/auth/AccountUi";
import { resolveAccountLocale, accountHref } from "@/lib/auth/accountLocale";
import { requireLearner } from "@/lib/auth/learnerIdentity";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ uiLang?: string; lang?: string; error?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = resolveAccountLocale(params);
  try { await requireLearner(); } catch { redirect(accountHref("/login", locale)); }
  const vi = locale === "vi";
  return <AccountCard title={vi ? "Chọn mật khẩu mới" : "Choose a new password"}>
    {params.error ? <p className={styles.error} role="alert">{vi ? "Không thể cập nhật mật khẩu. Vui lòng thử lại với ít nhất 8 ký tự." : "Unable to update your password. Use at least 8 characters and try again."}</p> : null}
    <form className={styles.form} action={updateLearnerPassword}>
      <input type="hidden" name="uiLang" value={locale}/>
      <AccountField name="password" label={vi ? "Mật khẩu mới" : "New password"} type="password" autoComplete="new-password" minLength={8} maxLength={128}/>
      <AccountField name="confirmPassword" label={vi ? "Nhập lại mật khẩu mới" : "Confirm new password"} type="password" autoComplete="new-password" minLength={8} maxLength={128}/>
      <button type="submit" className={styles.button}>{vi ? "Cập nhật mật khẩu" : "Update password"}</button>
    </form>
  </AccountCard>;
}
