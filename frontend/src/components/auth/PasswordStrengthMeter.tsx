import { getPasswordStrength, PASSWORD_RULES } from "../../utils/validation";
import "./PasswordStrengthMeter.css";

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
    <div className="psm-wrapper" aria-live="polite" aria-label={`Password strength: ${label}`}>
      {/* Segmented bar */}
      <div className="psm-bars" role="presentation">
        {Array.from({ length: TOTAL_BARS }, (_, i) => (
          <div
            key={i}
            className="psm-bar"
            style={{ background: i < score ? color : "#e5e7eb" }}
          />
        ))}
      </div>

      {/* Score label */}
      {label && (
        <div className="psm-score-row">
          <span className="psm-label" style={{ color }}>
            {label}
          </span>
        </div>
      )}

      {/* Per-rule checklist */}
      {showRules && (
        <ul className="psm-rules">
          {PASSWORD_RULES.map((rule) => {
            const passed = rule.test(password);
            return (
              <li key={rule.id} className={passed ? "rule-ok" : "rule-fail"}>
                <span className="rule-icon">{passed ? "✓" : "✗"}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
