"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

export default function UpgradePage() {
 const router = useRouter();
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 const upgradeRole = async () => {
 try {
 const res = await fetch("/api/auth/upgrade-role", { method: "POST" });
 const data = await res.json();
 
 if (res.ok && data.redirectUrl) {
 router.push(data.redirectUrl);
 router.refresh();
 } else {
 setError(data.error || "Failed to complete seller setup");
 setTimeout(() => router.push("/marketplace"), 3000);
 }
 } catch (err) {
 setError("Network error. Redirecting to marketplace...");
 setTimeout(() => router.push("/marketplace"), 3000);
 }
 };

 upgradeRole();
 }, [router]);

 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
 {error ? (
 <div className="flex flex-col items-center gap-4 animate-in fade-in">
 <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
 <AlertCircle className="h-6 w-6" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-gray-900">Setup Failed</h2>
 <p className="text-sm text-gray-500 mt-1">{error}</p>
 </div>
 </div>
 ) : (
 <div className="flex flex-col items-center gap-4 animate-in fade-in">
 <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
 <Loader2 className="h-6 w-6 animate-spin" />
 </div>
 <div>
 <h2 className="text-lg font-semibold text-gray-900">Setting up seller account</h2>
 <p className="text-sm text-gray-500 mt-1">Please wait a moment...</p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
