import { line, curveNatural } from 'd3';
export const Marks = ({
  binnedData,
  yScale,
  xScale,
  xValue,
  yValue,
  innerHeight,
  tooltip,
}) => (
  <g className="mark">
    <path
      fill="none"
      stroke="black"
      d={line()
        .x((d) => xScale(xValue(d)))
        .y((d) => yScale(yValue(d)))
        .curve(curveNatural)(binnedData)}
    />
    {binnedData.map((d) => (
      <rect
        x={xScale(d.x0)}
        y={yScale(d.y)}
        width={xScale(d.x1) - xScale(d.x0)}
        height={innerHeight - yScale(d.y)}
      >
        <title>{tooltip(d.y)}</title>
      </rect>
    ))}
  </g>
);