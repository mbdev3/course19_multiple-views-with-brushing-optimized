export const AxisBottom = ({
  xScale,
  height,
  tickFormat
}) =>
  xScale.ticks().map((tickValue) => (
    <g className = "tick"
      key={tickValue}
      transform={`translate(${xScale(
        tickValue
      )},0)`}
    >
      <line y2={height - 5} />
      <text
        style={{ textAnchor: 'middle' }}
        y={height -5}
        
      >
        {tickFormat(tickValue)}
      </text>
    </g>
  ));
