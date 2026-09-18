function MetricCard({ icon, label, value }) {
  return (
    <div className="metric-card">
      <span className="metric-icon">
        {icon}
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default MetricCard;