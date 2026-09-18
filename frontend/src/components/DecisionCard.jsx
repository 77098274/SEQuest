function DecisionCard({ decision, onDecision }) {
  return (
    <button
      className="decision-button"
      onClick={() => onDecision(decision.decision_id)}
    >
      <span>{decision.option_text}</span>

      <strong>→</strong>
    </button>
  );
}

export default DecisionCard;