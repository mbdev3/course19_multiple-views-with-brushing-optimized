import React ,{useState} from 'react';
import ReactDOM from 'react-dom';
import { useWorldAtlas } from './Data/useWorldAtlas';
import { useData } from './Data/useData';

import { scaleSqrt, max } from 'd3';
import { BubbleMap } from './BubbleMap/index';
import { DateHistogram } from './DateHistogram/index';
const width = window.innerWidth;
const height = window.innerHeight;
const DateHistogramSize = 0.3;
  const xValue = (d) => d['Reported Date'];
const App = () => {
  const worldAtlas = useWorldAtlas();
  const data = useData();
const [ brushExtent,setBrushExtent]=useState()
// console.log(brushExtent)
  if (!worldAtlas || !data) {
    return <pre>Loading...</pre>;
  }
const filteredData = brushExtent? data.filter(d=>{
const date = xValue(d);
return date > brushExtent[0] && date < brushExtent[1]

}): data
  return (
    <svg width={width} height={height}>
      <BubbleMap
        data={data}
        worldAtlas={worldAtlas}
        filteredData={filteredData}
      />
      <g
        transform={`translate(0,${
          height - DateHistogramSize * height
        })`}
      >
        <DateHistogram
          data={data}
          height={DateHistogramSize * height}
          width={width}
          setBrushExtent={setBrushExtent}
          xValue={xValue}
        />
      </g>
    </svg>
  );
};
const rootElement = document.getElementById(
  'root'
);
ReactDOM.render(<App />, rootElement);
