"use client";
import { useEffect, useState } from "react";

export type Lang = "en" | "hi";
const T: Record<string, Record<Lang, string>> = {
  report: { en: "Report issue", hi: "समस्या दर्ज करें" },
  mine: { en: "My complaints", hi: "मेरी शिकायतें" },
  track: { en: "Track", hi: "ट्रैक करें" },
  login: { en: "Login", hi: "लॉगिन" },
  logout: { en: "Logout", hi: "लॉगआउट" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  analytics: { en: "Analytics", hi: "विश्लेषण" },
  heroTitle: { en: "From citizen voices to cleaner cities", hi: "नागरिकों की आवाज़ से स्वच्छ शहर तक" },
  heroSub: { en: "Snap a photo of a pothole, garbage pile or water leak. AI classifies it, suggests a priority and routes it to the right department.", hi: "गड्ढे, कचरे के ढेर या पानी के रिसाव की फ़ोटो लें। AI उसे पहचानता है, प्राथमिकता सुझाता है और सही विभाग तक पहुँचाता है।" },
  reportBtn: { en: "Report an issue", hi: "समस्या दर्ज करें" },
  trackBtn: { en: "Track a complaint", hi: "शिकायत ट्रैक करें" },
  step1: { en: "1. Snap", hi: "1. फ़ोटो लें" }, step1d: { en: "Upload a photo and pin the location.", hi: "फ़ोटो अपलोड करें और स्थान चुनें।" },
  step2: { en: "2. AI triage", hi: "2. AI जाँच" }, step2d: { en: "Category, confidence and an explainable priority.", hi: "श्रेणी, विश्वसनीयता और स्पष्ट प्राथमिकता।" },
  step3: { en: "3. Resolve", hi: "3. समाधान" }, step3d: { en: "Officers assign, update and you track progress.", hi: "अधिकारी असाइन व अपडेट करते हैं, आप प्रगति देखें।" },
  reportTitle: { en: "Report a civic issue", hi: "नागरिक समस्या दर्ज करें" },
  photo: { en: "Photo", hi: "फ़ोटो" }, title: { en: "Short title", hi: "संक्षिप्त शीर्षक" },
  desc: { en: "Description", hi: "विवरण" }, lat: { en: "Latitude", hi: "अक्षांश" }, lng: { en: "Longitude", hi: "देशांतर" },
  useLoc: { en: "Use my location", hi: "मेरा स्थान उपयोग करें" }, mapHint: { en: "Tip: click the map to move the pin", hi: "पिन हिलाने के लिए नक्शे पर क्लिक करें" },
  submit: { en: "Submit", hi: "जमा करें" }, analysing: { en: "Analysing…", hi: "जाँच जारी…" },
  submitted: { en: "Complaint submitted", hi: "शिकायत दर्ज हो गई" }, yourRef: { en: "Your reference", hi: "आपका संदर्भ नंबर" },
  aiDetected: { en: "AI detected", hi: "AI ने पहचाना" }, confidence: { en: "confidence", hi: "विश्वसनीयता" },
  priority: { en: "Priority", hi: "प्राथमिकता" }, review: { en: "sent for human review", hi: "मानव समीक्षा के लिए भेजा गया" },
  dup: { en: "Possible duplicate of", hi: "संभावित डुप्लिकेट:" },
  trackThis: { en: "Track this complaint", hi: "यह शिकायत ट्रैक करें" },
  trackTitle: { en: "Track a complaint", hi: "शिकायत ट्रैक करें" }, timeline: { en: "Timeline", hi: "समय-रेखा" },
  noneYet: { en: "Nothing yet.", hi: "अभी कुछ नहीं।" },
  ref: { en: "Reference", hi: "संदर्भ" }, category: { en: "Category", hi: "श्रेणी" }, status: { en: "Status", hi: "स्थिति" },
  notifications: { en: "Notifications", hi: "सूचनाएँ" }, markRead: { en: "Mark all read", hi: "सभी पढ़ी हुई करें" },
  verifyEmail: { en: "Verify your email", hi: "अपना ईमेल सत्यापित करें" }, sendCode: { en: "Send code", hi: "कोड भेजें" },
  enterCode: { en: "Enter 6-digit code", hi: "6 अंकों का कोड दर्ज करें" }, verify: { en: "Verify", hi: "सत्यापित करें" },
  verified: { en: "Email verified", hi: "ईमेल सत्यापित" },
  s_submitted: { en: "Submitted", hi: "दर्ज" }, s_under_review: { en: "Under review", hi: "समीक्षाधीन" }, s_assigned: { en: "Assigned", hi: "सौंपा गया" },
  s_in_progress: { en: "In progress", hi: "कार्य जारी" }, s_resolved: { en: "Resolved", hi: "हल हुआ" }, s_rejected: { en: "Rejected", hi: "अस्वीकृत" },
  c_pothole: { en: "Pothole", hi: "गड्ढा" }, c_garbage: { en: "Garbage", hi: "कचरा" }, c_water_leak: { en: "Water leak", hi: "पानी का रिसाव" }, c_other: { en: "Other", hi: "अन्य" },
  p_high: { en: "high", hi: "उच्च" }, p_medium: { en: "medium", hi: "मध्यम" }, p_low: { en: "low", hi: "निम्न" },
};

export function getLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("cl_lang") as Lang) || "en";
}
export function setLang(l: Lang) { localStorage.setItem("cl_lang", l); window.dispatchEvent(new Event("cl_lang")); }

export function useT() {
  const [lang, setL] = useState<Lang>("en");
  useEffect(() => {
    const f = () => setL(getLang());
    f(); window.addEventListener("cl_lang", f);
    return () => window.removeEventListener("cl_lang", f);
  }, []);
  return { lang, t: (k: string) => T[k]?.[lang] ?? T[k]?.en ?? k };
}
