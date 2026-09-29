import OwnerShell from "../../components/OwnerShell";import VerifyEmail from "../../components/VerifyEmail";
export default function Page({searchParams}){return <OwnerShell title="Verify your email" description="Secure your new OrderXO account."><VerifyEmail token={searchParams?.token||""}/></OwnerShell>}
