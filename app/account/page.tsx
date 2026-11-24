import { redirect } from "next/navigation";
import { AccountCard, styles } from "@/app/auth/AccountUi";
import { requireLearner } from "@/lib/auth/learnerIdentity";
import { accountHref, resolveAccountLocale } from "@/lib/auth/accountLocale";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ uiLang?: string; lang?: string; password_updated?: string; error?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = resolveAccountLocale(params);
  let identity: Awaited<ReturnType<typeof requireLearner>>;
  try { identity = await requireLearner(); } catch { redirect(accountHref("/login", locale)); }
  const vi = locale === "vi";
  return <AccountCard title={vi ? "Tài khoản của tôi" : "Your account"} description={vi ? "Thông tin tài khoản người học." : "Learner account details."}>
    {params.password_updated === "1" ? <p className={styles.notice} role="status">{vi ? "Đã đổi mật khẩu." : "Your password was updated."}</p> : null}
    {params.error ? <p className={styles.error} role="alert">{vi ? "Không thể đăng xuất. Vui lòng thử lại." : "Unable to sign out. Please try again."}</p> : null}
    <p className={styles.email}>{identity.email ?? (vi ? "Tài khoản đã xác thực" : "Authenticated account")}</p>
    <p className={styles.description}>{vi ? "Lưu bài luyện tập, lịch sử học và tiến độ học chưa được kích hoạt trong phiên bản tài khoản này." : "Saved practice, learning history and progress are not enabled by this account foundation."}</p>
    <form action="/auth/signout" method="post">
      <input type="hidden" name="uiLang" value={locale}/>
      <button type="submit" className={styles.button}>{vi ? "Đăng xuất" : "Sign out"}</button>
    </form>
  </AccountCard>;
}
