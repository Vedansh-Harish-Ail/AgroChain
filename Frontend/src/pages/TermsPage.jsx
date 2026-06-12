import React from 'react';
import { ShieldCheck, FileText, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800/60 p-6 md:p-8">
        
        {/* Header Navigation */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Previous Page
        </button>

        {/* Title Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3.5 mb-8 border-b border-slate-200/60 dark:border-slate-800 pb-6">
          <div className="bg-emerald-500/10 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Terms & Conditions for Quality Labs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Official Regulatory and Compliance Guidelines for AgroBlock Quality Certifications
            </p>
          </div>
        </div>

        {/* Advisory Warning */}
        <div className="flex gap-3 p-4 mb-6 rounded-2xl border border-amber-100 bg-amber-50/20 dark:border-amber-950/20 dark:bg-amber-950/5 text-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Legal Agreement & Responsibility Notice</span>
            <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Applying as a Quality Lab (QT) on the AgroBlock network creates a legally binding contract. By certifying crops, you issue cryptographic signatures that directly affect trade values, public trust, and consumer health. Fraudulent activity will be prosecuted to the full extent of the law.
            </p>
          </div>
        </div>

        {/* Detailed Guidelines */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-350">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">1</span>
              Accreditation & License Validity
            </h2>
            <div className="pl-7 space-y-1 text-xs">
              <p>1.1. Quality Labs must possess a valid registration license issued by the government agricultural authority.</p>
              <p>1.2. The lab must maintain active laboratory accreditation (e.g., NABL, ISO 17025) and present valid document proofs upon request.</p>
              <p>1.3. Any suspension, expiry, or revocation of your official operating license must be self-reported within 24 hours, resulting in deactivation of your AgroBlock account.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">2</span>
              Testing Standards & Truthfulness
            </h2>
            <div className="pl-7 space-y-1 text-xs">
              <p>2.1. All crop testing must follow standard scientific protocols (evaluating moisture, purity, organic content, and pesticide clearance).</p>
              <p>2.2. You are strictly forbidden from inputting false quality grades (e.g., Grade A+ vs Grade B) or altering data to benefit specific sellers.</p>
              <p>2.3. Base pricing listings must reflect fair regional market pricing metrics relative to the certified grade.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">3</span>
              Cryptographic Accountability & MetaMask
            </h2>
            <div className="pl-7 space-y-1 text-xs">
              <p>3.1. When issuing a Batch Quality Certificate, you must sign the registry transaction (`ProductRegistry.sol`) on-chain via MetaMask.</p>
              <p>3.2. Because blockchain transactions are immutable, your digital signature is non-repudiable proof of your lab's certification.</p>
              <p>3.3. You are solely responsible for securing your wallet's private keys. Any action executed by your linked address is legally attributed to your laboratory.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">4</span>
              Jurisdiction & Regional Routing
            </h2>
            <div className="pl-7 space-y-1 text-xs">
              <p>4.1. You are authorized to certify only those crop registrations explicitly routed to your testing center based on your district and PIN code coverage settings.</p>
              <p>4.2. Circumventing assignment filters or certifying crops outside your assigned jurisdiction will lead to immediate account suspension and review.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">5</span>
              Audit Trails & Penalties
            </h2>
            <div className="pl-7 space-y-1 text-xs">
              <p>5.1. The System Administrator conducts regular random audits of certified lots against physical retention samples.</p>
              <p>5.2. Minor compliance infractions will result in temporary suspension (INACTIVE status).</p>
              <p>5.3. Major infractions, including data fabrication or bribery, will lead to permanent deactivation (SUSPENDED status), loss of security deposits, and reporting to relevant government regulatory bodies.</p>
            </div>
          </section>

        </div>

        {/* Summary Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Blockchain Audit Active
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="w-full sm:w-auto bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold py-2.5 px-6 rounded-xl transition"
          >
            Acknowledge Guidelines
          </button>
        </div>

      </div>
    </div>
  );
}
