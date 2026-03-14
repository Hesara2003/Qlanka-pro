import { getPasswordStrength, PASSWORD_RULES } from "../../utils/validation";

interface Props {
  password: string;
  /** Show the rule checklist below the bar. Default: true */
  showRules?: boolean;
}

const TOTAL_BARS = 5;

export default function PasswordStrengthMeter({
  password,
  showRules = true,
}: Props) {
  if (!password) return null;

  const { score, label, color } = getPasswordStrength(password);

  return (
    <div className="mt-2" aria-live="polite" aria-label={`Password strength: ${label}`}>
      {/* Segmented bar */}
      <div className="flex gap-1 h-[5px] mb-1.5" role="presentation">
        {Array.from({ length: TOTAL_BARS }, (_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-200 ease-in-out"
            style={{ backgroundColor: i < score ? color : "#e5e7eb" }}
          />
        ))}
      </div>

      {/* Score label */}
      {label && (
        <div className="flex justify-end mb-2">
          <span className="text-xs font-semibold transition-colors duration-200 ease-in-out" style={{ color }}>
            {label}
          </span>
        </div>
      )}

      {/* Per-rule checklist */}
      {showRules && (
        <ul className="list-none p-0 m-0 flex flex-col gap-1">
          {PASSWORD_RULES.map((rule) => {
            const passed = rule.test(password);
            return (
              <li key={rule.id} className={`text-[12px] flex items-center gap-1.5 ${passed ? "text-green-600" : "text-gray-400"}`}>
                <span className="text-[11px] w-3 text-center">{passed ? "✓" : "✗"}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
