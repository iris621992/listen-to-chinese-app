import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AccountCard, AccountField, styles } from "@/app/auth/AccountUi";
import { accountHref, resolveAccountLocale } from "@/lib/auth/accountLocale";

type Props = { searchParams: Promise<{ uiLang?: string; lang?: string; error?: string; sent?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = resolveAccountLocale(params);
  const vi = locale === "vi";
  return <AccountCard title={vi ? "Đặt lại mật khẩu" : "Reset password"} description={vi ? "Nhập email để nhận hướng dẫn đặt lại mật khẩu." : "Enter your email to request password recovery."}>
    {params.sent === "1" ? <p className={styles.notice} role="status">{vi ? "Nếu tài khoản có thể nhận email khôi phục, hướng dẫn đã được gửi." : "If the account can receive recovery email, instructions have been sent."}</p> : null}
    {params.error ? <p className={styles.error} role="alert">{vi ? "Vui lòng kiểm tra định dạng email và thử lại." : "Check the email format and try again."}</p> : null}
    <form className={styles.form} action={requestPasswordReset}>
      <input type="hidden" name="uiLang" value={locale}/>
      <AccountField name="email" label="Email" type="email" autoComplete="email" maxLength={254}/>
      <button type="submit" className={styles.button}>{vi ? "Gửi email khôi phục" : "Send recovery email"}</button>
    </form>
    <div className={styles.actions}><Link className={styles.link} href={accountHref("/login", locale)}>{vi ? "Quay lại đăng nhập" : "Back to sign in"}</Link></div>
  </AccountCard>;
}
