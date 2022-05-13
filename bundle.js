(function (React$1, ReactDOM, d3, topojson) {
  'use strict';

  var React$1__default = 'default' in React$1 ? React$1['default'] : React$1;
  ReactDOM = ReactDOM && Object.prototype.hasOwnProperty.call(ReactDOM, 'default') ? ReactDOM['default'] : ReactDOM;

  const jsonUrl = 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json';

  const useWorldAtlas = () => {
    const [data, setData] = React$1.useState(null);

    React$1.useEffect(() => {
      d3.json(jsonUrl).then(topology => {
        const { countries, land } = topology.objects;
        setData({
          land: topojson.feature(topology, land),
          interiors: topojson.mesh(topology, countries, (a, b) => a !== b)
        });
      });
    }, []);

    return data;
  };

  const csvUrl =
    'https://gist.githubusercontent.com/curran/a9656d711a8ad31d812b8f9963ac441c/raw/267eac8b97d161c479d950ffad3ddd5ce2d1f370/MissingMigrants-Global-2019-10-08T09-47-14-subset.csv';

  const row = (d) => {
    d.coords = d['Location Coordinates']
      .split(',')
      .map((d) => +d)
      .reverse();
    d['Total Dead and Missing'] = + d['Total Dead and Missing'];
    
        d['Reported Date'] = new Date(d['Reported Date'] );
    return d;
  };

  const useData = () => {
    const [data, setData] = React$1.useState(null);

    React$1.useEffect(() => {
      d3.csv(csvUrl, row).then(setData);
    }, []);

    return data;
  };

  const projection = d3.geoNaturalEarth1();
  const path = d3.geoPath(projection);
  const graticule = d3.geoGraticule();

  const Marks = ({
    worldAtlas: { land, interiors },
    data,
    sizeScale,
    sizeValue,
  }) => (
    React.createElement( 'g', { className: "marks" },
      React$1.useMemo(
        () => (
          React.createElement( React.Fragment, null,
            React.createElement( 'path', {
              className: "sphere", d: path({ type: 'Sphere' }) }),
            React.createElement( 'path', {
              className: "graticules", d: path(graticule()) }),
            land.features.map((feature) => (
              React.createElement( 'path', {
                className: "land", d: path(feature) })
            )),
            React.createElement( 'path', {
              className: "interiors", d: path(interiors) })
          )
        ),
        [path, graticule, land, interiors]
      ),
      data.map((d) => {
        const [x, y] = projection(d.coords);
        // console.log(projection(d.coords))
        return (
          React.createElement( 'circle', {
            cx: x, cy: y, r: sizeScale(sizeValue(d)) },
            React.createElement( 'title', null,
              'missing migrants : ' +
                d['Total Dead and Missing']
            )
          )
        );
      })
    )
  );

  const sizeValue = (d) =>
    d['Total Dead and Missing'];
  const maxRadius = 15;
  const BubbleMap = ({
    data,
    worldAtlas,
    filteredData,
  }) => {
    const sizeScale = React$1.useMemo(
      () =>
        d3.scaleSqrt()
          .domain([0, d3.max(data, sizeValue)])
          .range([0, maxRadius]),
      [data, sizeValue, maxRadius]
    );

    return (
      React$1__default.createElement( Marks, {
        worldAtlas: worldAtlas, data: filteredData, sizeScale: sizeScale, sizeValue: sizeValue })
    );
  };

  const Marks$1 = ({
    binnedData,
    yScale,
    xScale,
    xValue,
    yValue,
    innerHeight,
    tooltip,
  }) => (
    React.createElement( 'g', { className: "mark" },
      React.createElement( 'path', {
        fill: "none", stroke: "black", d: d3.line()
          .x((d) => xScale(xValue(d)))
          .y((d) => yScale(yValue(d)))
          .curve(d3.curveNatural)(binnedData) }),
      binnedData.map((d) => (
        React.createElement( 'rect', {
          x: xScale(d.x0), y: yScale(d.y), width: xScale(d.x1) - xScale(d.x0), height: innerHeight - yScale(d.y) },
          React.createElement( 'title', null, tooltip(d.y) )
        )
      ))
    )
  );

  const AxisBottom = ({
    xScale,
    height,
    tickFormat
  }) =>
    xScale.ticks().map((tickValue) => (
      React.createElement( 'g', { className: "tick", key: tickValue, transform: `translate(${xScale(
        tickValue
      )},0)` },
        React.createElement( 'line', { y2: height - 5 }),
        React.createElement( 'text', {
          style: { textAnchor: 'middle' }, y: height -5 },
          tickFormat(tickValue)
        )
      )
    ));

  const AxisLeft = ({ yScale, width }) =>
    yScale.ticks().map((tickValue) => (
      React.createElement( 'g', {
        className: "tick", transform: `translate(0,${yScale(
        tickValue
      )})` },
        React.createElement( 'line', { x2: width }), " //y1= ", yScale(tickValue), " y2=", yScale(tickValue),
        React.createElement( 'text', {
          key: tickValue, style: { textAnchor: 'end' }, x: -5, dy: ".32em" },
          tickValue
        )
      )
    ));

  const margin = {
    top: 0,
    bottom: 30,
    right: 0,
    left: 60,
  };
  const xAxisTickFormat = d3.timeFormat('%m/%d/%Y');

  const yValue = (d) => d['Total Dead and Missing'];
  const yAxisLabel = 'Total Dead and Missing';

  const DateHistogram = ({
    data,
    height,
    width,
    setBrushExtent,
    xValue,
  }) => {
    const brushRef = React$1.useRef();

    const innerHeight =
      height - margin.top - margin.bottom;
    const innerWidth =
      width - margin.right - margin.left;

    const xScale = React$1.useMemo(
      () =>
        d3.scaleTime()
          .domain(d3.extent(data, xValue))
          .range([0, innerWidth])
          .nice(),
      [data, xValue, innerWidth]
    );

    const binnedData = React$1.useMemo(() => {
      const [start, stop] = xScale.domain();
     
      return d3.bin()
        .value(xValue)
        .domain(xScale.domain())
        .thresholds(d3.timeMonths(start, stop))(data)
        .map((array) => ({
          y: d3.sum(array, yValue),
          x0: array.x0,
          x1: array.x1,
        }));
    }, [xValue, xScale, data, yValue]);
    const yScale = React$1.useMemo(
      () =>{
        // console.log("test")
        return d3.scaleLinear()
          .domain([0, d3.max(binnedData, (d) => d.y)])
          .range([innerHeight, 0])
          .nice()},
      [binnedData, innerHeight]
    );
    React$1.useEffect(() => {
      const brush = d3.brushX().extent([
        [0, 0],
        [innerWidth, innerHeight],
      ]);
      brush(d3.select(brushRef.current));
      brush.on('brush end', (e) => {
        setBrushExtent(
          e.selection &&
            e.selection.map(xScale.invert)
        );
      });
    }, [innerWidth, innerHeight]);
    return (
      React$1__default.createElement( React$1__default.Fragment, null,
        React$1__default.createElement( 'rect', {
          width: width, height: height, fill: "white" }),
        React$1__default.createElement( 'g', {
          transform: `translate(${margin.left},${margin.top})` },
          React$1__default.createElement( AxisBottom, {
            height: height, xScale: xScale, tickFormat: xAxisTickFormat }),
          React$1__default.createElement( AxisLeft, { yScale: yScale, width: width }),
          React$1__default.createElement( 'text', {
            className: "label", textAnchor: "middle", x: innerWidth / 2, y: height - margin.bottom / 2 }),
          React$1__default.createElement( 'text', {
            className: "label", textAnchor: "middle", transform: `translate(${-40},${
            innerHeight / 2
          }) rotate(-90)` },
            yAxisLabel
          ),
          React$1__default.createElement( Marks$1, {
            binnedData: binnedData, xScale: xScale, yScale: yScale, xValue: xValue, yValue: yValue, innerHeight: innerHeight, tooltip: (d) => d }),
          React$1__default.createElement( 'g', { ref: brushRef })
        )
      )
    );
  };

  const width = window.innerWidth;
  const height = window.innerHeight;
  const DateHistogramSize = 0.3;
    const xValue = (d) => d['Reported Date'];
  const App = () => {
    const worldAtlas = useWorldAtlas();
    const data = useData();
  const [ brushExtent,setBrushExtent]=React$1.useState();
  // console.log(brushExtent)
    if (!worldAtlas || !data) {
      return React$1__default.createElement( 'pre', null, "Loading..." );
    }
  const filteredData = brushExtent? data.filter(d=>{
  const date = xValue(d);
  return date > brushExtent[0] && date < brushExtent[1]

  }): data;
    return (
      React$1__default.createElement( 'svg', { width: width, height: height },
        React$1__default.createElement( BubbleMap, {
          data: data, worldAtlas: worldAtlas, filteredData: filteredData }),
        React$1__default.createElement( 'g', {
          transform: `translate(0,${
          height - DateHistogramSize * height
        })` },
          React$1__default.createElement( DateHistogram, {
            data: data, height: DateHistogramSize * height, width: width, setBrushExtent: setBrushExtent, xValue: xValue })
        )
      )
    );
  };
  const rootElement = document.getElementById(
    'root'
  );
  ReactDOM.render(React$1__default.createElement( App, null ), rootElement);

}(React, ReactDOM, d3, topojson));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIkRhdGEvdXNlV29ybGRBdGxhcy5qcyIsIkRhdGEvdXNlRGF0YS5qcyIsIkJ1YmJsZU1hcC9NYXJrcy5qcyIsIkJ1YmJsZU1hcC9pbmRleC5qcyIsIkRhdGVIaXN0b2dyYW0vTWFya3MuanMiLCJEYXRlSGlzdG9ncmFtL2F4aXNCb3R0b20uanMiLCJEYXRlSGlzdG9ncmFtL2F4aXNMZWZ0LmpzIiwiRGF0ZUhpc3RvZ3JhbS9pbmRleC5qcyIsImluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsganNvbiB9IGZyb20gJ2QzJztcbmltcG9ydCB7IGZlYXR1cmUsIG1lc2ggfSBmcm9tICd0b3BvanNvbic7XG5cbmNvbnN0IGpzb25VcmwgPSAnaHR0cHM6Ly91bnBrZy5jb20vd29ybGQtYXRsYXNAMi4wLjIvY291bnRyaWVzLTUwbS5qc29uJztcblxuZXhwb3J0IGNvbnN0IHVzZVdvcmxkQXRsYXMgPSAoKSA9PiB7XG4gIGNvbnN0IFtkYXRhLCBzZXREYXRhXSA9IHVzZVN0YXRlKG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAganNvbihqc29uVXJsKS50aGVuKHRvcG9sb2d5ID0+IHtcbiAgICAgIGNvbnN0IHsgY291bnRyaWVzLCBsYW5kIH0gPSB0b3BvbG9neS5vYmplY3RzO1xuICAgICAgc2V0RGF0YSh7XG4gICAgICAgIGxhbmQ6IGZlYXR1cmUodG9wb2xvZ3ksIGxhbmQpLFxuICAgICAgICBpbnRlcmlvcnM6IG1lc2godG9wb2xvZ3ksIGNvdW50cmllcywgKGEsIGIpID0+IGEgIT09IGIpXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiBkYXRhO1xufTtcbiIsImltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBjc3YgfSBmcm9tICdkMyc7XG5cbmNvbnN0IGNzdlVybCA9XG4gICdodHRwczovL2dpc3QuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2N1cnJhbi9hOTY1NmQ3MTFhOGFkMzFkODEyYjhmOTk2M2FjNDQxYy9yYXcvMjY3ZWFjOGI5N2QxNjFjNDc5ZDk1MGZmYWQzZGRkNWNlMmQxZjM3MC9NaXNzaW5nTWlncmFudHMtR2xvYmFsLTIwMTktMTAtMDhUMDktNDctMTQtc3Vic2V0LmNzdic7XG5cbmNvbnN0IHJvdyA9IChkKSA9PiB7XG4gIGQuY29vcmRzID0gZFsnTG9jYXRpb24gQ29vcmRpbmF0ZXMnXVxuICAgIC5zcGxpdCgnLCcpXG4gICAgLm1hcCgoZCkgPT4gK2QpXG4gICAgLnJldmVyc2UoKTtcbiAgZFsnVG90YWwgRGVhZCBhbmQgTWlzc2luZyddID0gKyBkWydUb3RhbCBEZWFkIGFuZCBNaXNzaW5nJ107XG4gIFxuICAgICAgZFsnUmVwb3J0ZWQgRGF0ZSddID0gbmV3IERhdGUoZFsnUmVwb3J0ZWQgRGF0ZSddIClcbiAgcmV0dXJuIGQ7XG59O1xuXG5leHBvcnQgY29uc3QgdXNlRGF0YSA9ICgpID0+IHtcbiAgY29uc3QgW2RhdGEsIHNldERhdGFdID0gdXNlU3RhdGUobnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjc3YoY3N2VXJsLCByb3cpLnRoZW4oc2V0RGF0YSk7XG4gIH0sIFtdKTtcblxuICByZXR1cm4gZGF0YTtcbn07XG4iLCJpbXBvcnQge1xuICBnZW9OYXR1cmFsRWFydGgxLFxuICBnZW9QYXRoLFxuICBnZW9HcmF0aWN1bGUsXG59IGZyb20gJ2QzJztcbmltcG9ydCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCc7XG5jb25zdCBwcm9qZWN0aW9uID0gZ2VvTmF0dXJhbEVhcnRoMSgpO1xuY29uc3QgcGF0aCA9IGdlb1BhdGgocHJvamVjdGlvbik7XG5jb25zdCBncmF0aWN1bGUgPSBnZW9HcmF0aWN1bGUoKTtcblxuZXhwb3J0IGNvbnN0IE1hcmtzID0gKHtcbiAgd29ybGRBdGxhczogeyBsYW5kLCBpbnRlcmlvcnMgfSxcbiAgZGF0YSxcbiAgc2l6ZVNjYWxlLFxuICBzaXplVmFsdWUsXG59KSA9PiAoXG4gIDxnIGNsYXNzTmFtZT1cIm1hcmtzXCI+XG4gICAge3VzZU1lbW8oXG4gICAgICAoKSA9PiAoXG4gICAgICAgIDw+XG4gICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInNwaGVyZVwiXG4gICAgICAgICAgICBkPXtwYXRoKHsgdHlwZTogJ1NwaGVyZScgfSl9XG4gICAgICAgICAgLz5cbiAgICAgICAgICA8cGF0aFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiZ3JhdGljdWxlc1wiXG4gICAgICAgICAgICBkPXtwYXRoKGdyYXRpY3VsZSgpKX1cbiAgICAgICAgICAvPlxuICAgICAgICAgIHtsYW5kLmZlYXR1cmVzLm1hcCgoZmVhdHVyZSkgPT4gKFxuICAgICAgICAgICAgPHBhdGhcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibGFuZFwiXG4gICAgICAgICAgICAgIGQ9e3BhdGgoZmVhdHVyZSl9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICkpfVxuICAgICAgICAgIDxwYXRoXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpbnRlcmlvcnNcIlxuICAgICAgICAgICAgZD17cGF0aChpbnRlcmlvcnMpfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvPlxuICAgICAgKSxcbiAgICAgIFtwYXRoLCBncmF0aWN1bGUsIGxhbmQsIGludGVyaW9yc11cbiAgICApfVxuICAgIHtkYXRhLm1hcCgoZCkgPT4ge1xuICAgICAgY29uc3QgW3gsIHldID0gcHJvamVjdGlvbihkLmNvb3Jkcyk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhwcm9qZWN0aW9uKGQuY29vcmRzKSlcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxjaXJjbGVcbiAgICAgICAgICBjeD17eH1cbiAgICAgICAgICBjeT17eX1cbiAgICAgICAgICByPXtzaXplU2NhbGUoc2l6ZVZhbHVlKGQpKX1cbiAgICAgICAgPlxuICAgICAgICAgIDx0aXRsZT5cbiAgICAgICAgICAgIHsnbWlzc2luZyBtaWdyYW50cyA6ICcgK1xuICAgICAgICAgICAgICBkWydUb3RhbCBEZWFkIGFuZCBNaXNzaW5nJ119XG4gICAgICAgICAgPC90aXRsZT5cbiAgICAgICAgPC9jaXJjbGU+XG4gICAgICApO1xuICAgIH0pfVxuICA8L2c+XG4pO1xuIiwiaW1wb3J0IFJlYWN0LCB7IHVzZU1lbW8gfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBNYXJrcyB9IGZyb20gJy4vTWFya3MnO1xuaW1wb3J0IHsgc2NhbGVTcXJ0LCBtYXggfSBmcm9tICdkMyc7XG5cbmNvbnN0IHNpemVWYWx1ZSA9IChkKSA9PlxuICBkWydUb3RhbCBEZWFkIGFuZCBNaXNzaW5nJ107XG5jb25zdCBtYXhSYWRpdXMgPSAxNTtcbmV4cG9ydCBjb25zdCBCdWJibGVNYXAgPSAoe1xuICBkYXRhLFxuICB3b3JsZEF0bGFzLFxuICBmaWx0ZXJlZERhdGEsXG59KSA9PiB7XG4gIGNvbnN0IHNpemVTY2FsZSA9IHVzZU1lbW8oXG4gICAgKCkgPT5cbiAgICAgIHNjYWxlU3FydCgpXG4gICAgICAgIC5kb21haW4oWzAsIG1heChkYXRhLCBzaXplVmFsdWUpXSlcbiAgICAgICAgLnJhbmdlKFswLCBtYXhSYWRpdXNdKSxcbiAgICBbZGF0YSwgc2l6ZVZhbHVlLCBtYXhSYWRpdXNdXG4gICk7XG5cbiAgcmV0dXJuIChcbiAgICA8TWFya3NcbiAgICAgIHdvcmxkQXRsYXM9e3dvcmxkQXRsYXN9XG4gICAgICBkYXRhPXtmaWx0ZXJlZERhdGF9XG4gICAgICBzaXplU2NhbGU9e3NpemVTY2FsZX1cbiAgICAgIHNpemVWYWx1ZT17c2l6ZVZhbHVlfVxuICAgIC8+XG4gICk7XG59O1xuIiwiaW1wb3J0IHsgbGluZSwgY3VydmVOYXR1cmFsIH0gZnJvbSAnZDMnO1xuZXhwb3J0IGNvbnN0IE1hcmtzID0gKHtcbiAgYmlubmVkRGF0YSxcbiAgeVNjYWxlLFxuICB4U2NhbGUsXG4gIHhWYWx1ZSxcbiAgeVZhbHVlLFxuICBpbm5lckhlaWdodCxcbiAgdG9vbHRpcCxcbn0pID0+IChcbiAgPGcgY2xhc3NOYW1lPVwibWFya1wiPlxuICAgIDxwYXRoXG4gICAgICBmaWxsPVwibm9uZVwiXG4gICAgICBzdHJva2U9XCJibGFja1wiXG4gICAgICBkPXtsaW5lKClcbiAgICAgICAgLngoKGQpID0+IHhTY2FsZSh4VmFsdWUoZCkpKVxuICAgICAgICAueSgoZCkgPT4geVNjYWxlKHlWYWx1ZShkKSkpXG4gICAgICAgIC5jdXJ2ZShjdXJ2ZU5hdHVyYWwpKGJpbm5lZERhdGEpfVxuICAgIC8+XG4gICAge2Jpbm5lZERhdGEubWFwKChkKSA9PiAoXG4gICAgICA8cmVjdFxuICAgICAgICB4PXt4U2NhbGUoZC54MCl9XG4gICAgICAgIHk9e3lTY2FsZShkLnkpfVxuICAgICAgICB3aWR0aD17eFNjYWxlKGQueDEpIC0geFNjYWxlKGQueDApfVxuICAgICAgICBoZWlnaHQ9e2lubmVySGVpZ2h0IC0geVNjYWxlKGQueSl9XG4gICAgICA+XG4gICAgICAgIDx0aXRsZT57dG9vbHRpcChkLnkpfTwvdGl0bGU+XG4gICAgICA8L3JlY3Q+XG4gICAgKSl9XG4gIDwvZz5cbik7IiwiZXhwb3J0IGNvbnN0IEF4aXNCb3R0b20gPSAoe1xuICB4U2NhbGUsXG4gIGhlaWdodCxcbiAgdGlja0Zvcm1hdFxufSkgPT5cbiAgeFNjYWxlLnRpY2tzKCkubWFwKCh0aWNrVmFsdWUpID0+IChcbiAgICA8ZyBjbGFzc05hbWUgPSBcInRpY2tcIlxuICAgICAga2V5PXt0aWNrVmFsdWV9XG4gICAgICB0cmFuc2Zvcm09e2B0cmFuc2xhdGUoJHt4U2NhbGUoXG4gICAgICAgIHRpY2tWYWx1ZVxuICAgICAgKX0sMClgfVxuICAgID5cbiAgICAgIDxsaW5lIHkyPXtoZWlnaHQgLSA1fSAvPlxuICAgICAgPHRleHRcbiAgICAgICAgc3R5bGU9e3sgdGV4dEFuY2hvcjogJ21pZGRsZScgfX1cbiAgICAgICAgeT17aGVpZ2h0IC01fVxuICAgICAgICBcbiAgICAgID5cbiAgICAgICAge3RpY2tGb3JtYXQodGlja1ZhbHVlKX1cbiAgICAgIDwvdGV4dD5cbiAgICA8L2c+XG4gICkpO1xuIiwiZXhwb3J0IGNvbnN0IEF4aXNMZWZ0ID0gKHsgeVNjYWxlLCB3aWR0aCB9KSA9PlxuICB5U2NhbGUudGlja3MoKS5tYXAoKHRpY2tWYWx1ZSkgPT4gKFxuICAgIDxnXG4gICAgICBjbGFzc05hbWU9XCJ0aWNrXCJcbiAgICAgIHRyYW5zZm9ybT17YHRyYW5zbGF0ZSgwLCR7eVNjYWxlKFxuICAgICAgICB0aWNrVmFsdWVcbiAgICAgICl9KWB9XG4gICAgPlxuICAgICAgPGxpbmUgeDI9e3dpZHRofSAvPiAvL3kxPVxuICAgICAge3lTY2FsZSh0aWNrVmFsdWUpfSB5Mj17eVNjYWxlKHRpY2tWYWx1ZSl9XG4gICAgICA8dGV4dFxuICAgICAgICBrZXk9e3RpY2tWYWx1ZX1cbiAgICAgICAgc3R5bGU9e3sgdGV4dEFuY2hvcjogJ2VuZCcgfX1cbiAgICAgICAgeD17LTV9XG4gICAgICAgIGR5PVwiLjMyZW1cIlxuICAgICAgPlxuICAgICAgICB7dGlja1ZhbHVlfVxuICAgICAgPC90ZXh0PlxuICAgIDwvZz5cbiAgKSk7XG4iLCJpbXBvcnQgUmVhY3QsIHtcbiAgdXNlU3RhdGUsXG4gIHVzZUNhbGxiYWNrLFxuICB1c2VFZmZlY3QsXG4gIHVzZVJlZixcbiAgdXNlTWVtbyxcbn0gZnJvbSAncmVhY3QnO1xuXG5pbXBvcnQge1xuICBzY2FsZUxpbmVhcixcbiAgbWF4LFxuICBmb3JtYXQsXG4gIGV4dGVudCxcbiAgc2NhbGVUaW1lLFxuICB0aW1lRm9ybWF0LFxuICBiaW4sXG4gIHRpbWVNb250aHMsXG4gIHN1bSxcbiAgYnJ1c2hYLFxuICBzZWxlY3QsXG4gIGV2ZW50LFxufSBmcm9tICdkMyc7XG5pbXBvcnQgeyBNYXJrcyB9IGZyb20gJy4vTWFya3MnO1xuaW1wb3J0IHsgQXhpc0JvdHRvbSB9IGZyb20gJy4vYXhpc0JvdHRvbSc7XG5pbXBvcnQgeyBBeGlzTGVmdCB9IGZyb20gJy4vYXhpc0xlZnQnO1xuXG5jb25zdCBtYXJnaW4gPSB7XG4gIHRvcDogMCxcbiAgYm90dG9tOiAzMCxcbiAgcmlnaHQ6IDAsXG4gIGxlZnQ6IDYwLFxufTtcbmNvbnN0IHhBeGlzVGlja0Zvcm1hdCA9IHRpbWVGb3JtYXQoJyVtLyVkLyVZJyk7XG5jb25zdCB4QXhpc0xhYmVsID0gJ0RhdGUnO1xuXG5jb25zdCB5VmFsdWUgPSAoZCkgPT4gZFsnVG90YWwgRGVhZCBhbmQgTWlzc2luZyddO1xuY29uc3QgeUF4aXNMYWJlbCA9ICdUb3RhbCBEZWFkIGFuZCBNaXNzaW5nJztcblxuZXhwb3J0IGNvbnN0IERhdGVIaXN0b2dyYW0gPSAoe1xuICBkYXRhLFxuICBoZWlnaHQsXG4gIHdpZHRoLFxuICBzZXRCcnVzaEV4dGVudCxcbiAgeFZhbHVlLFxufSkgPT4ge1xuICBjb25zdCBicnVzaFJlZiA9IHVzZVJlZigpO1xuXG4gIGNvbnN0IGlubmVySGVpZ2h0ID1cbiAgICBoZWlnaHQgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbTtcbiAgY29uc3QgaW5uZXJXaWR0aCA9XG4gICAgd2lkdGggLSBtYXJnaW4ucmlnaHQgLSBtYXJnaW4ubGVmdDtcblxuICBjb25zdCB4U2NhbGUgPSB1c2VNZW1vKFxuICAgICgpID0+XG4gICAgICBzY2FsZVRpbWUoKVxuICAgICAgICAuZG9tYWluKGV4dGVudChkYXRhLCB4VmFsdWUpKVxuICAgICAgICAucmFuZ2UoWzAsIGlubmVyV2lkdGhdKVxuICAgICAgICAubmljZSgpLFxuICAgIFtkYXRhLCB4VmFsdWUsIGlubmVyV2lkdGhdXG4gICk7XG5cbiAgY29uc3QgYmlubmVkRGF0YSA9IHVzZU1lbW8oKCkgPT4ge1xuICAgIGNvbnN0IFtzdGFydCwgc3RvcF0gPSB4U2NhbGUuZG9tYWluKCk7XG4gICBcbiAgICByZXR1cm4gYmluKClcbiAgICAgIC52YWx1ZSh4VmFsdWUpXG4gICAgICAuZG9tYWluKHhTY2FsZS5kb21haW4oKSlcbiAgICAgIC50aHJlc2hvbGRzKHRpbWVNb250aHMoc3RhcnQsIHN0b3ApKShkYXRhKVxuICAgICAgLm1hcCgoYXJyYXkpID0+ICh7XG4gICAgICAgIHk6IHN1bShhcnJheSwgeVZhbHVlKSxcbiAgICAgICAgeDA6IGFycmF5LngwLFxuICAgICAgICB4MTogYXJyYXkueDEsXG4gICAgICB9KSk7XG4gIH0sIFt4VmFsdWUsIHhTY2FsZSwgZGF0YSwgeVZhbHVlXSk7XG4gIGNvbnN0IHlTY2FsZSA9IHVzZU1lbW8oXG4gICAgKCkgPT57XG4gICAgICAvLyBjb25zb2xlLmxvZyhcInRlc3RcIilcbiAgICAgIHJldHVybiBzY2FsZUxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIG1heChiaW5uZWREYXRhLCAoZCkgPT4gZC55KV0pXG4gICAgICAgIC5yYW5nZShbaW5uZXJIZWlnaHQsIDBdKVxuICAgICAgICAubmljZSgpfSxcbiAgICBbYmlubmVkRGF0YSwgaW5uZXJIZWlnaHRdXG4gICk7XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYnJ1c2ggPSBicnVzaFgoKS5leHRlbnQoW1xuICAgICAgWzAsIDBdLFxuICAgICAgW2lubmVyV2lkdGgsIGlubmVySGVpZ2h0XSxcbiAgICBdKTtcbiAgICBicnVzaChzZWxlY3QoYnJ1c2hSZWYuY3VycmVudCkpO1xuICAgIGJydXNoLm9uKCdicnVzaCBlbmQnLCAoZSkgPT4ge1xuICAgICAgc2V0QnJ1c2hFeHRlbnQoXG4gICAgICAgIGUuc2VsZWN0aW9uICYmXG4gICAgICAgICAgZS5zZWxlY3Rpb24ubWFwKHhTY2FsZS5pbnZlcnQpXG4gICAgICApO1xuICAgIH0pO1xuICB9LCBbaW5uZXJXaWR0aCwgaW5uZXJIZWlnaHRdKTtcbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPHJlY3RcbiAgICAgICAgd2lkdGg9e3dpZHRofVxuICAgICAgICBoZWlnaHQ9e2hlaWdodH1cbiAgICAgICAgZmlsbD1cIndoaXRlXCJcbiAgICAgIC8+XG4gICAgICA8Z1xuICAgICAgICB0cmFuc2Zvcm09e2B0cmFuc2xhdGUoJHttYXJnaW4ubGVmdH0sJHttYXJnaW4udG9wfSlgfVxuICAgICAgPlxuICAgICAgICA8QXhpc0JvdHRvbVxuICAgICAgICAgIGhlaWdodD17aGVpZ2h0fVxuICAgICAgICAgIHhTY2FsZT17eFNjYWxlfVxuICAgICAgICAgIHRpY2tGb3JtYXQ9e3hBeGlzVGlja0Zvcm1hdH1cbiAgICAgICAgLz5cbiAgICAgICAgPEF4aXNMZWZ0IHlTY2FsZT17eVNjYWxlfSB3aWR0aD17d2lkdGh9IC8+XG4gICAgICAgIDx0ZXh0XG4gICAgICAgICAgY2xhc3NOYW1lPVwibGFiZWxcIlxuICAgICAgICAgIHRleHRBbmNob3I9XCJtaWRkbGVcIlxuICAgICAgICAgIHg9e2lubmVyV2lkdGggLyAyfVxuICAgICAgICAgIHk9e2hlaWdodCAtIG1hcmdpbi5ib3R0b20gLyAyfVxuICAgICAgICA+PC90ZXh0PlxuICAgICAgICA8dGV4dFxuICAgICAgICAgIGNsYXNzTmFtZT1cImxhYmVsXCJcbiAgICAgICAgICB0ZXh0QW5jaG9yPVwibWlkZGxlXCJcbiAgICAgICAgICB0cmFuc2Zvcm09e2B0cmFuc2xhdGUoJHstNDB9LCR7XG4gICAgICAgICAgICBpbm5lckhlaWdodCAvIDJcbiAgICAgICAgICB9KSByb3RhdGUoLTkwKWB9XG4gICAgICAgID5cbiAgICAgICAgICB7eUF4aXNMYWJlbH1cbiAgICAgICAgPC90ZXh0PlxuICAgICAgICA8TWFya3NcbiAgICAgICAgICBiaW5uZWREYXRhPXtiaW5uZWREYXRhfVxuICAgICAgICAgIHhTY2FsZT17eFNjYWxlfVxuICAgICAgICAgIHlTY2FsZT17eVNjYWxlfVxuICAgICAgICAgIHhWYWx1ZT17eFZhbHVlfVxuICAgICAgICAgIHlWYWx1ZT17eVZhbHVlfVxuICAgICAgICAgIGlubmVySGVpZ2h0PXtpbm5lckhlaWdodH1cbiAgICAgICAgICB0b29sdGlwPXsoZCkgPT4gZH1cbiAgICAgICAgLz5cbiAgICAgICAgPGcgcmVmPXticnVzaFJlZn0gLz5cbiAgICAgIDwvZz5cbiAgICA8Lz5cbiAgKTtcbn07XG4iLCJpbXBvcnQgUmVhY3QgLHt1c2VTdGF0ZX0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IFJlYWN0RE9NIGZyb20gJ3JlYWN0LWRvbSc7XG5pbXBvcnQgeyB1c2VXb3JsZEF0bGFzIH0gZnJvbSAnLi9EYXRhL3VzZVdvcmxkQXRsYXMnO1xuaW1wb3J0IHsgdXNlRGF0YSB9IGZyb20gJy4vRGF0YS91c2VEYXRhJztcblxuaW1wb3J0IHsgc2NhbGVTcXJ0LCBtYXggfSBmcm9tICdkMyc7XG5pbXBvcnQgeyBCdWJibGVNYXAgfSBmcm9tICcuL0J1YmJsZU1hcC9pbmRleCc7XG5pbXBvcnQgeyBEYXRlSGlzdG9ncmFtIH0gZnJvbSAnLi9EYXRlSGlzdG9ncmFtL2luZGV4JztcbmNvbnN0IHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG5jb25zdCBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5jb25zdCBEYXRlSGlzdG9ncmFtU2l6ZSA9IDAuMztcbiAgY29uc3QgeFZhbHVlID0gKGQpID0+IGRbJ1JlcG9ydGVkIERhdGUnXTtcbmNvbnN0IEFwcCA9ICgpID0+IHtcbiAgY29uc3Qgd29ybGRBdGxhcyA9IHVzZVdvcmxkQXRsYXMoKTtcbiAgY29uc3QgZGF0YSA9IHVzZURhdGEoKTtcbmNvbnN0IFsgYnJ1c2hFeHRlbnQsc2V0QnJ1c2hFeHRlbnRdPXVzZVN0YXRlKClcbi8vIGNvbnNvbGUubG9nKGJydXNoRXh0ZW50KVxuICBpZiAoIXdvcmxkQXRsYXMgfHwgIWRhdGEpIHtcbiAgICByZXR1cm4gPHByZT5Mb2FkaW5nLi4uPC9wcmU+O1xuICB9XG5jb25zdCBmaWx0ZXJlZERhdGEgPSBicnVzaEV4dGVudD8gZGF0YS5maWx0ZXIoZD0+e1xuY29uc3QgZGF0ZSA9IHhWYWx1ZShkKTtcbnJldHVybiBkYXRlID4gYnJ1c2hFeHRlbnRbMF0gJiYgZGF0ZSA8IGJydXNoRXh0ZW50WzFdXG5cbn0pOiBkYXRhXG4gIHJldHVybiAoXG4gICAgPHN2ZyB3aWR0aD17d2lkdGh9IGhlaWdodD17aGVpZ2h0fT5cbiAgICAgIDxCdWJibGVNYXBcbiAgICAgICAgZGF0YT17ZGF0YX1cbiAgICAgICAgd29ybGRBdGxhcz17d29ybGRBdGxhc31cbiAgICAgICAgZmlsdGVyZWREYXRhPXtmaWx0ZXJlZERhdGF9XG4gICAgICAvPlxuICAgICAgPGdcbiAgICAgICAgdHJhbnNmb3JtPXtgdHJhbnNsYXRlKDAsJHtcbiAgICAgICAgICBoZWlnaHQgLSBEYXRlSGlzdG9ncmFtU2l6ZSAqIGhlaWdodFxuICAgICAgICB9KWB9XG4gICAgICA+XG4gICAgICAgIDxEYXRlSGlzdG9ncmFtXG4gICAgICAgICAgZGF0YT17ZGF0YX1cbiAgICAgICAgICBoZWlnaHQ9e0RhdGVIaXN0b2dyYW1TaXplICogaGVpZ2h0fVxuICAgICAgICAgIHdpZHRoPXt3aWR0aH1cbiAgICAgICAgICBzZXRCcnVzaEV4dGVudD17c2V0QnJ1c2hFeHRlbnR9XG4gICAgICAgICAgeFZhbHVlPXt4VmFsdWV9XG4gICAgICAgIC8+XG4gICAgICA8L2c+XG4gICAgPC9zdmc+XG4gICk7XG59O1xuY29uc3Qgcm9vdEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgJ3Jvb3QnXG4pO1xuUmVhY3RET00ucmVuZGVyKDxBcHAgLz4sIHJvb3RFbGVtZW50KTtcbiJdLCJuYW1lcyI6WyJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsImpzb24iLCJmZWF0dXJlIiwibWVzaCIsImNzdiIsImdlb05hdHVyYWxFYXJ0aDEiLCJnZW9QYXRoIiwiZ2VvR3JhdGljdWxlIiwidXNlTWVtbyIsInNjYWxlU3FydCIsIm1heCIsIlJlYWN0IiwiTWFya3MiLCJsaW5lIiwiY3VydmVOYXR1cmFsIiwidGltZUZvcm1hdCIsInVzZVJlZiIsInNjYWxlVGltZSIsImV4dGVudCIsImJpbiIsInRpbWVNb250aHMiLCJzdW0iLCJzY2FsZUxpbmVhciIsImJydXNoWCIsInNlbGVjdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBSUEsTUFBTSxPQUFPLEdBQUcsd0RBQXdELENBQUM7QUFDekU7RUFDTyxNQUFNLGFBQWEsR0FBRyxNQUFNO0VBQ25DLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBR0EsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QztFQUNBLEVBQUVDLGlCQUFTLENBQUMsTUFBTTtFQUNsQixJQUFJQyxPQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSTtFQUNuQyxNQUFNLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztFQUNuRCxNQUFNLE9BQU8sQ0FBQztFQUNkLFFBQVEsSUFBSSxFQUFFQyxnQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUM7RUFDckMsUUFBUSxTQUFTLEVBQUVDLGFBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQy9ELE9BQU8sQ0FBQyxDQUFDO0VBQ1QsS0FBSyxDQUFDLENBQUM7RUFDUCxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVDtFQUNBLEVBQUUsT0FBTyxJQUFJLENBQUM7RUFDZCxDQUFDOztFQ2pCRCxNQUFNLE1BQU07RUFDWixFQUFFLCtLQUErSyxDQUFDO0FBQ2xMO0VBQ0EsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUs7RUFDbkIsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQztFQUN0QyxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUM7RUFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztFQUNuQixLQUFLLE9BQU8sRUFBRSxDQUFDO0VBQ2YsRUFBRSxDQUFDLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0VBQzlEO0VBQ0EsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFFO0VBQ3hELEVBQUUsT0FBTyxDQUFDLENBQUM7RUFDWCxDQUFDLENBQUM7QUFDRjtFQUNPLE1BQU0sT0FBTyxHQUFHLE1BQU07RUFDN0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHSixnQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pDO0VBQ0EsRUFBRUMsaUJBQVMsQ0FBQyxNQUFNO0VBQ2xCLElBQUlJLE1BQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQ25DLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNUO0VBQ0EsRUFBRSxPQUFPLElBQUksQ0FBQztFQUNkLENBQUM7O0VDbkJELE1BQU0sVUFBVSxHQUFHQyxtQkFBZ0IsRUFBRSxDQUFDO0VBQ3RDLE1BQU0sSUFBSSxHQUFHQyxVQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7RUFDakMsTUFBTSxTQUFTLEdBQUdDLGVBQVksRUFBRSxDQUFDO0FBQ2pDO0VBQ08sTUFBTSxLQUFLLEdBQUcsQ0FBQztFQUN0QixFQUFFLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7RUFDakMsRUFBRSxJQUFJO0VBQ04sRUFBRSxTQUFTO0VBQ1gsRUFBRSxTQUFTO0VBQ1gsQ0FBQztFQUNELEVBQUUsNEJBQUcsV0FBVTtFQUNmLElBQUtDLGVBQU87RUFDWixNQUFNO0VBQ04sUUFBUTtFQUNSLFVBQVU7RUFDVixZQUFZLFdBQVUsUUFBUSxFQUNsQixHQUFHLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRTtFQUV4QyxVQUFVO0VBQ1YsWUFBWSxXQUFVLFlBQVksRUFDdEIsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUU7RUFFakMsVUFBVyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU87RUFDckMsWUFBWTtFQUNaLGNBQWMsV0FBVSxNQUFNLEVBQ2hCLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRSxDQUNqQjtFQUNkLFdBQVc7RUFDWCxVQUFVO0VBQ1YsWUFBWSxXQUFVLFdBQVcsRUFDckIsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFFLENBQ25CO0VBQ1osU0FBVztFQUNYLE9BQU87RUFDUCxNQUFNLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDO0VBQ3hDO0VBQ0EsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLO0VBQ3JCLE1BQU0sTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQzFDO0VBQ0EsTUFBTTtFQUNOLFFBQVE7RUFDUixVQUFVLElBQUksQ0FBRSxFQUNOLElBQUksQ0FBRSxFQUNOLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFFbkMsVUFBVTtFQUNWLFlBQWEscUJBQXFCO0VBQ2xDLGNBQWMsQ0FBQyxDQUFDLHdCQUF3QixDQUFFO0VBQzFDLFdBQWtCO0VBQ2xCLFNBQWlCO0VBQ2pCLFFBQVE7RUFDUixLQUFLLENBQUU7RUFDUCxHQUFNO0VBQ04sQ0FBQzs7RUN2REQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0VBQ3BCLEVBQUUsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUM7RUFDOUIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0VBQ2QsTUFBTSxTQUFTLEdBQUcsQ0FBQztFQUMxQixFQUFFLElBQUk7RUFDTixFQUFFLFVBQVU7RUFDWixFQUFFLFlBQVk7RUFDZCxDQUFDLEtBQUs7RUFDTixFQUFFLE1BQU0sU0FBUyxHQUFHQSxlQUFPO0VBQzNCLElBQUk7RUFDSixNQUFNQyxZQUFTLEVBQUU7RUFDakIsU0FBUyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUVDLE1BQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUMxQyxTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztFQUM5QixJQUFJLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUM7RUFDaEMsR0FBRyxDQUFDO0FBQ0o7RUFDQSxFQUFFO0VBQ0YsSUFBSUMsZ0NBQUM7RUFDTCxNQUFNLFlBQVksVUFBVyxFQUN2QixNQUFNLFlBQWEsRUFDbkIsV0FBVyxTQUFVLEVBQ3JCLFdBQVcsV0FBVSxDQUNyQjtFQUNOLElBQUk7RUFDSixDQUFDOztFQzNCTSxNQUFNQyxPQUFLLEdBQUcsQ0FBQztFQUN0QixFQUFFLFVBQVU7RUFDWixFQUFFLE1BQU07RUFDUixFQUFFLE1BQU07RUFDUixFQUFFLE1BQU07RUFDUixFQUFFLE1BQU07RUFDUixFQUFFLFdBQVc7RUFDYixFQUFFLE9BQU87RUFDVCxDQUFDO0VBQ0QsRUFBRSw0QkFBRyxXQUFVO0VBQ2YsSUFBSTtFQUNKLE1BQU0sTUFBSyxNQUFNLEVBQ1gsUUFBTyxPQUFPLEVBQ2QsR0FBR0MsT0FBSSxFQUFFO0VBQ2YsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQyxTQUFTLEtBQUssQ0FBQ0MsZUFBWSxDQUFDLENBQUMsVUFBVSxHQUFFO0VBRXpDLElBQUssVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdEIsTUFBTTtFQUNOLFFBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxFQUNoQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQ2YsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFLEVBQ25DLFFBQVEsV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUV4QyxRQUFRLG9DQUFRLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFLEVBQVE7RUFDckMsT0FBYTtFQUNiLEtBQUssQ0FBRTtFQUNQLEdBQU07RUFDTixDQUFDOztFQzlCTSxNQUFNLFVBQVUsR0FBRyxDQUFDO0VBQzNCLEVBQUUsTUFBTTtFQUNSLEVBQUUsTUFBTTtFQUNSLEVBQUUsVUFBVTtFQUNaLENBQUM7RUFDRCxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTO0VBQy9CLElBQUksNEJBQUcsV0FBWSxNQUFNLEVBQ25CLEtBQUssU0FBVSxFQUNmLFdBQVcsQ0FBQyxVQUFVLEVBQUUsTUFBTTtBQUNwQyxRQUFRLFNBQVM7QUFDakIsT0FBTyxDQUFDLEdBQUc7RUFFWCxNQUFNLCtCQUFNLElBQUksTUFBTSxHQUFHLEdBQUU7RUFDM0IsTUFBTTtFQUNOLFFBQVEsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUcsRUFDaEMsR0FBRyxNQUFNLEVBQUU7RUFHbkIsUUFBUyxVQUFVLENBQUMsU0FBUyxDQUFFO0VBQy9CLE9BQWE7RUFDYixLQUFRO0VBQ1IsR0FBRyxDQUFDOztFQ3JCRyxNQUFNLFFBQVEsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtFQUMxQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTO0VBQy9CLElBQUk7RUFDSixNQUFNLFdBQVUsTUFBTSxFQUNoQixXQUFXLENBQUMsWUFBWSxFQUFFLE1BQU07QUFDdEMsUUFBUSxTQUFTO0FBQ2pCLE9BQU8sQ0FBQyxDQUFDO0VBRVQsTUFBTSwrQkFBTSxJQUFJLE9BQU0sR0FBRyxXQUNsQixNQUFNLENBQUMsU0FBUyxHQUFFLFFBQUssTUFBTSxDQUFDLFNBQVM7RUFDOUMsTUFBTTtFQUNOLFFBQVEsS0FBSyxTQUFVLEVBQ2YsT0FBTyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUcsRUFDN0IsR0FBRyxDQUFDLENBQUUsRUFDTixJQUFHO0VBRVgsUUFBUyxTQUFVO0VBQ25CLE9BQWE7RUFDYixLQUFRO0VBQ1IsR0FBRyxDQUFDOztFQ09KLE1BQU0sTUFBTSxHQUFHO0VBQ2YsRUFBRSxHQUFHLEVBQUUsQ0FBQztFQUNSLEVBQUUsTUFBTSxFQUFFLEVBQUU7RUFDWixFQUFFLEtBQUssRUFBRSxDQUFDO0VBQ1YsRUFBRSxJQUFJLEVBQUUsRUFBRTtFQUNWLENBQUMsQ0FBQztFQUNGLE1BQU0sZUFBZSxHQUFHQyxhQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFL0M7RUFDQSxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FBQztFQUNsRCxNQUFNLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQztBQUM1QztFQUNPLE1BQU0sYUFBYSxHQUFHLENBQUM7RUFDOUIsRUFBRSxJQUFJO0VBQ04sRUFBRSxNQUFNO0VBQ1IsRUFBRSxLQUFLO0VBQ1AsRUFBRSxjQUFjO0VBQ2hCLEVBQUUsTUFBTTtFQUNSLENBQUMsS0FBSztFQUNOLEVBQUUsTUFBTSxRQUFRLEdBQUdDLGNBQU0sRUFBRSxDQUFDO0FBQzVCO0VBQ0EsRUFBRSxNQUFNLFdBQVc7RUFDbkIsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0VBQ3hDLEVBQUUsTUFBTSxVQUFVO0VBQ2xCLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztBQUN2QztFQUNBLEVBQUUsTUFBTSxNQUFNLEdBQUdSLGVBQU87RUFDeEIsSUFBSTtFQUNKLE1BQU1TLFlBQVMsRUFBRTtFQUNqQixTQUFTLE1BQU0sQ0FBQ0MsU0FBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztFQUNyQyxTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztFQUMvQixTQUFTLElBQUksRUFBRTtFQUNmLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQztFQUM5QixHQUFHLENBQUM7QUFDSjtFQUNBLEVBQUUsTUFBTSxVQUFVLEdBQUdWLGVBQU8sQ0FBQyxNQUFNO0VBQ25DLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7RUFDMUM7RUFDQSxJQUFJLE9BQU9XLE1BQUcsRUFBRTtFQUNoQixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUM7RUFDcEIsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0VBQzlCLE9BQU8sVUFBVSxDQUFDQyxhQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQ2hELE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxNQUFNO0VBQ3ZCLFFBQVEsQ0FBQyxFQUFFQyxNQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQztFQUM3QixRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtFQUNwQixRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFBRTtFQUNwQixPQUFPLENBQUMsQ0FBQyxDQUFDO0VBQ1YsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUNyQyxFQUFFLE1BQU0sTUFBTSxHQUFHYixlQUFPO0VBQ3hCLElBQUksS0FBSztFQUNUO0VBQ0EsTUFBTSxPQUFPYyxjQUFXLEVBQUU7RUFDMUIsU0FBUyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUVaLE1BQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDakQsU0FBUyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDaEMsU0FBUyxJQUFJLEVBQUUsQ0FBQztFQUNoQixJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQztFQUM3QixHQUFHLENBQUM7RUFDSixFQUFFVixpQkFBUyxDQUFDLE1BQU07RUFDbEIsSUFBSSxNQUFNLEtBQUssR0FBR3VCLFNBQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQztFQUNsQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUNaLE1BQU0sQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO0VBQy9CLEtBQUssQ0FBQyxDQUFDO0VBQ1AsSUFBSSxLQUFLLENBQUNDLFNBQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztFQUNwQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxLQUFLO0VBQ2pDLE1BQU0sY0FBYztFQUNwQixRQUFRLENBQUMsQ0FBQyxTQUFTO0VBQ25CLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztFQUN4QyxPQUFPLENBQUM7RUFDUixLQUFLLENBQUMsQ0FBQztFQUNQLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0VBQ2hDLEVBQUU7RUFDRixJQUFJYjtFQUNKLE1BQU1BO0VBQ04sUUFBUSxPQUFPLEtBQU0sRUFDYixRQUFRLE1BQU8sRUFDZixNQUFLLFNBQU87RUFFcEIsTUFBTUE7RUFDTixRQUFRLFdBQVcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBRTNELFFBQVFBLGdDQUFDO0VBQ1QsVUFBVSxRQUFRLE1BQU8sRUFDZixRQUFRLE1BQU8sRUFDZixZQUFZLGlCQUFnQjtFQUV0QyxRQUFRQSxnQ0FBQyxZQUFTLFFBQVEsTUFBTyxFQUFDLE9BQU8sT0FBTTtFQUMvQyxRQUFRQTtFQUNSLFVBQVUsV0FBVSxPQUFPLEVBQ2pCLFlBQVcsUUFBUSxFQUNuQixHQUFHLFVBQVUsR0FBRyxDQUFFLEVBQ2xCLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FDN0I7RUFDVCxRQUFRQTtFQUNSLFVBQVUsV0FBVSxPQUFPLEVBQ2pCLFlBQVcsUUFBUSxFQUNuQixXQUFXLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdkMsWUFBWSxXQUFXLEdBQUcsQ0FBQztBQUMzQixXQUFXLGFBQWE7RUFFeEIsVUFBVyxVQUFXO0VBQ3RCO0VBQ0EsUUFBUUEsZ0NBQUNDO0VBQ1QsVUFBVSxZQUFZLFVBQVcsRUFDdkIsUUFBUSxNQUFPLEVBQ2YsUUFBUSxNQUFPLEVBQ2YsUUFBUSxNQUFPLEVBQ2YsUUFBUSxNQUFPLEVBQ2YsYUFBYSxXQUFZLEVBQ3pCLFNBQVMsQ0FBQyxDQUFDLEtBQUssR0FBRTtFQUU1QixRQUFRRCx1Q0FBRyxLQUFLLFVBQVMsQ0FBRztFQUM1QixPQUFVO0VBQ1YsS0FBTztFQUNQLElBQUk7RUFDSixDQUFDOztFQ3BJRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO0VBQ2hDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7RUFDbEMsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7RUFDOUIsRUFBRSxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUM7RUFDM0MsTUFBTSxHQUFHLEdBQUcsTUFBTTtFQUNsQixFQUFFLE1BQU0sVUFBVSxHQUFHLGFBQWEsRUFBRSxDQUFDO0VBQ3JDLEVBQUUsTUFBTSxJQUFJLEdBQUcsT0FBTyxFQUFFLENBQUM7RUFDekIsTUFBTSxFQUFFLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQ1osZ0JBQVEsR0FBRTtFQUM5QztFQUNBLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksRUFBRTtFQUM1QixJQUFJLE9BQU9ZLDZDQUFLLFlBQVUsRUFBTSxDQUFDO0VBQ2pDLEdBQUc7RUFDSCxNQUFNLFlBQVksR0FBRyxXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7RUFDakQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3ZCLE9BQU8sSUFBSSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUNyRDtFQUNBLENBQUMsQ0FBQyxFQUFFLEtBQUk7RUFDUixFQUFFO0VBQ0YsSUFBSUEseUNBQUssT0FBTyxLQUFNLEVBQUMsUUFBUTtFQUMvQixNQUFNQSxnQ0FBQztFQUNQLFFBQVEsTUFBTSxJQUFLLEVBQ1gsWUFBWSxVQUFXLEVBQ3ZCLGNBQWMsY0FBYTtFQUVuQyxNQUFNQTtFQUNOLFFBQVEsV0FBVyxDQUFDLFlBQVk7QUFDaEMsVUFBVSxNQUFNLEdBQUcsaUJBQWlCLEdBQUcsTUFBTTtBQUM3QyxTQUFTLENBQUM7RUFFVixRQUFRQSxnQ0FBQztFQUNULFVBQVUsTUFBTSxJQUFLLEVBQ1gsUUFBUSxpQkFBaUIsR0FBRyxNQUFPLEVBQ25DLE9BQU8sS0FBTSxFQUNiLGdCQUFnQixjQUFlLEVBQy9CLFFBQVEsUUFBTyxDQUNmO0VBQ1YsT0FBVTtFQUNWLEtBQVU7RUFDVixJQUFJO0VBQ0osQ0FBQyxDQUFDO0VBQ0YsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGNBQWM7RUFDM0MsRUFBRSxNQUFNO0VBQ1IsQ0FBQyxDQUFDO0VBQ0YsUUFBUSxDQUFDLE1BQU0sQ0FBQ0EsZ0NBQUMsU0FBRyxFQUFHLEVBQUUsV0FBVyxDQUFDOzs7OyJ9