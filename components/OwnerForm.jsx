"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
const fields = {
 signup: [["name","Your name","text"],["email","Email","email"],["password","Password (12+ characters)","password"]],
 login: [["email","Email","email"],["password","Password","password"]],
 onboarding: [["restaurantName","Restaurant name","text"],["restaurantSlug","Restaurant URL slug","text"],["locationName","First location","text"]],
 resend: [["email","Email","email"]],
};
export default function OwnerForm({ mode, plan = "starter" }) {
 const router=useRouter(); const [form,setForm]=useState({locationName:"Main Location"}); const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
 async function submit(e){e.preventDefault();setBusy(true);setError("");setMessage("");try{
 const res=await fetch(`/api/owner/${mode === "resend" ? "resend-verification" : mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="onboarding"?{...form,plan}:form)});
 const data=await res.json();if(!res.ok)throw new Error(data.error||data.message||"Request failed");
 if(mode==="signup"){router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);return;}
 if(mode==="login"){router.push("/onboarding");router.refresh();return;}
 if(mode==="onboarding"){router.push("/dashboard");router.refresh();return;}
 setMessage(data.message||"Verification email sent.");
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 return <form onSubmit={submit} className="space-y-4">{fields[mode].map(([key,label,type])=><label key={key} className="block text-sm font-medium text-slate-700">{label}<input required minLength={key==="password"&&mode==="signup"?12:undefined} maxLength={key==="password"?128:undefined} type={type} value={form[key]||""} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-orange-500"/></label>)}{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}<button disabled={busy} className="w-full rounded-xl bg-orange-600 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy?"Please wait…":({signup:"Create account",login:"Sign in",onboarding:"Create restaurant",resend:"Resend verification email"}[mode])}</button>{mode==="signup"&&<p className="text-sm">Already registered? <Link className="text-orange-700 underline" href="/login">Sign in</Link></p>}{mode==="login"&&<p className="text-sm">New to OrderXO? <Link className="text-orange-700 underline" href="/signup">Create account</Link></p>}</form>
}
