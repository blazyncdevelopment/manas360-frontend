import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { patientApi } from "../../api/patient";

export default function CommunicationPreferences() {
  const [channel, setChannel] = useState<string>("whatsapp");
  const [email, setEmail] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setSaving(true);
    try {
      const channelMap: Record<string, string> = {
        "whatsapp": "WhatsApp",
        "sms": "SMS",
        "email": "Email"
      };

      const languageMap: Record<string, string> = {
        "English": "English",
        "हिंदी": "Hindi",
        "ಕನ್ನಡ": "Kannada"
      };

      const payload: { communicationPreference: string; preferredLanguage: string; email?: string } = {
        communicationPreference: channelMap[channel],
        preferredLanguage: languageMap[language] || language,
      };

      if (channel === "email") {
        payload.email = email;
      }

      await patientApi.updateCommunicationPreferences(payload);

      localStorage.setItem("patient_communication_preferences", JSON.stringify({
        channel,
        email: channel === "email" ? email : undefined,
        language
      }));

      // Moving state forward as requested by "recordEvent(COMM_PREFS_SAVED) moves state forward"
      navigate("/plans", { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-2xl border border-calm-sage/15 bg-white p-6 shadow-soft-sm">
        <h2 className="mb-6 text-xl font-bold text-charcoal">
          How should we reach you?
        </h2>

        <div className="mb-6 flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="channel"
              value="whatsapp"
              checked={channel === "whatsapp"}
              onChange={(e) => setChannel(e.target.value)}
              className="h-4 w-4 accent-teal-600"
            />
            <span className="text-sm font-medium text-charcoal">WhatsApp (recommended)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="channel"
              value="sms"
              checked={channel === "sms"}
              onChange={(e) => setChannel(e.target.value)}
              className="h-4 w-4 accent-teal-600"
            />
            <span className="text-sm font-medium text-charcoal">SMS</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="channel"
              value="email"
              checked={channel === "email"}
              onChange={(e) => setChannel(e.target.value)}
              className="h-4 w-4 accent-teal-600"
            />
            <span className="text-sm font-medium text-charcoal">Email only</span>
          </label>
          {channel === "email" && (
            <div className="ml-7 mt-1">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-calm-sage/20 bg-white px-4 py-2.5 text-sm text-charcoal outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
              />
            </div>
          )}
        </div>

        <div className="mb-2 text-sm font-semibold text-charcoal/70">
          Language
        </div>
        <div className="mb-8 flex flex-wrap gap-2">
          {["English", "हिंदी", "ಕನ್ನಡ"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${language === lang
                ? "border-teal-400 bg-teal-50 text-teal-700"
                : "border-calm-sage/20 bg-white text-charcoal hover:bg-calm-sage/5"
                }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
