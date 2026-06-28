export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F7] font-sans px-6">
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center max-w-lg">
        <h1 className="text-3xl font-black text-[#1A3668] uppercase mb-4">PURCHASE SUCCESSFUL</h1>
        <p className="text-slate-600 mb-8">
          Your credits have been securely provisioned to your account. 
          Please log in with the email used during checkout to access your dashboard.
        </p>
        <a 
          href="/login" 
          className="bg-[#FF5F1F] text-white px-8 py-3 rounded font-bold uppercase tracking-widest hover:bg-orange-600 transition-all"
        >
          Proceed to Login
        </a>
      </div>
    </div>
  );
}