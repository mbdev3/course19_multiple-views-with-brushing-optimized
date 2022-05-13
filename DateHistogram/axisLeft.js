export const AxisLeft = ({ yScale, width }) =>
  yScale.ticks().map((tickValue) => (
    <g
      className="tick"
      transform={`translate(0,${yScale(
        tickValue
      )})`}
    >
      <line x2={width} /> //y1=
      {yScale(tickValue)} y2={yScale(tickValue)}
      <text
        key={tickValue}
        style={{ textAnchor: 'end' }}
        x={-5}
        dy=".32em"
      >
        {tickValue}
      </text>
    </g>
  ));
