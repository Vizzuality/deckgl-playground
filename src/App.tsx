import { useState } from "react";

// import { TripsLayer } from "@deck.gl/geo-layers/typed";
import { Position } from "@deck.gl/core/typed";
import type { PathGeometry } from "@deck.gl/layers/typed/path-layer/path";
import { DeckGL } from "@deck.gl/react/typed";
import Maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";

import ScatterplotLayer from "@/components/layers/scatterplot-layer/scatterplot-layer";
import { Slider } from "@/components/ui/slider";

// import MONARCH_JSON from "@/data/monarch.json";
import PATH_JSON from "@/data/path.json";

// const D = MONARCH_JSON["1"].sort((a, b) => a.timestamp - b.timestamp);
// const DATA = [
//   {
//     path: D.map((d) => d.coordinates),
//     timestamps: D.map((d) => d.timestamp - D[0].timestamp),
//     min: 0,
//     max: D[D.length - 1].timestamp - D[0].timestamp,
//   },
// ];

const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.72,
  zoom: 3,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

function App() {
  const [time, setTime] = useState(0);

  // const duration = 60 * 60 * 24 * 365 * 1000;
  // const trailLength = 60 * 60 * 24 * 7 * 1000;
  const duration = 83;

  const layers = [
    // new TripsLayer<{
    //   path: PathGeometry;
    //   timestamps: number[];
    // }>({
    //   id: "TripsLayer",
    //   // data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
    //   data: PATH_JSON,
    //   // data: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json",
    //   /* props from TripsLayer class */
    //   currentTime: time,
    //   // fadeTrail: true,
    //   // getTimestamps: d => d.waypoints.map(p => p.timestamp - d.waypoints[0].timestamp),
    //   getTimestamps: (d) => d.timestamps,
    //   // getRandom: () => Math.random(),
    //   trailLength,
    //   // duration,
    //   fadeTrail: true,
    //   /* props inherited from PathLayer class */
    //   // billboard: false,
    //   getColor: [128, 93, 253],
    //   getPath: (d) => d.path,
    //   getWidth: 1,
    //   capRounded: true,
    //   jointRounded: true,
    //   // miterLimit: 4,
    //   // widthMaxPixels: Number.MAX_SAFE_INTEGER,
    //   widthMinPixels: 5,
    //   // widthScale: 1,
    //   widthUnits: "meters",
    //   /* props inherited from Layer class */
    //   // autoHighlight: false,
    //   // coordinateOrigin: [0, 0, 0],
    //   // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    //   // highlightColor: [0, 0, 128, 128],
    //   // modelMatrix: null,
    //   opacity: 0.8,
    //   // pickable: false,
    //   // visible: true,
    //   // wrapLongitude: false,
    // }),
    // new MigrationPathLayer<{
    //   path: PathGeometry;
    //   timestamps: number[];
    // }>({
    //   id: "MigrationPathLayer",
    //   // data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
    //   data: DATA,
    //   /* props from TripsLayer class */
    //   trailLength,
    //   currentTime: time,
    //   duration,
    //   fadeTrail: true,
    //   getTimestamps: (d) => d.timestamps,
    //   getRandom: () => Math.random(),
    //   /* props inherited from PathLayer class */
    //   // billboard: false,
    //   getColor: [128, 93, 253],
    //   getPath: (d) => d.path,
    //   getWidth: 1,
    //   capRounded: true,
    //   jointRounded: true,
    //   // miterLimit: 4,
    //   // widthMaxPixels: Number.MAX_SAFE_INTEGER,
    //   widthMinPixels: 5,
    //   // widthScale: 1,
    //   widthUnits: "meters",
    //   /* props inherited from Layer class */
    //   // autoHighlight: false,
    //   // coordinateOrigin: [0, 0, 0],
    //   // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    //   // highlightColor: [0, 0, 128, 128],
    //   // modelMatrix: null,
    //   opacity: 0.8,
    //   // pickable: false,
    //   // visible: true,
    //   // wrapLongitude: false,
    // }),
    // new MigrationScatterplotLayer<{
    //   path: PathGeometry;
    //   timestamps: number[];
    // }>({
    //   id: "MigrationScatterplotLayer",
    //   // data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
    //   data: PATH_JSON,

    //   currentTime: time,
    //   duration,
    //   /* props inherited from PathLayer class */
    //   // billboard: false,
    //   getRadius: 100,
    //   radiusUnits: "pixels",
    //   getFillColor: [128, 93, 253],

    //   getPath: () => [0, 0, 0],
    //   getTimestamps: (d) => d.timestamps,
    //   getRandom: () => Math.random(),
    //   getPosition: () => [0, 0],

    //   /* props inherited from Layer class */
    //   // autoHighlight: false,
    //   // coordinateOrigin: [0, 0, 0],
    //   // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    //   // highlightColor: [0, 0, 128, 128],
    //   // modelMatrix: null,
    //   opacity: 0.8,
    //   // pickable: false,
    //   // visible: true,
    //   // wrapLongitude: false,
    // }),
    new ScatterplotLayer<
      {
        path: PathGeometry;
        timestamps: number[];
      },
      Record<string, unknown>
    >({
      id: "ScatterplotLayer",
      // data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
      data: PATH_JSON,

      /* props inherited from PathLayer class */
      // billboard: false,
      getRadius: 10,
      radiusUnits: "pixels",
      getFillColor: [128, 93, 253],

      uCurrentTime: time,

      getPosition: (d) => d.path[Math.floor(time)] as Position,
      getNextPosition: (d) => d.path[Math.ceil(time)] as Position,

      /* props inherited from Layer class */
      // autoHighlight: false,
      // coordinateOrigin: [0, 0, 0],
      // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      // highlightColor: [0, 0, 128, 128],
      // modelMatrix: null,
      opacity: 0.8,
      // pickable: false,
      // visible: true,
      // wrapLongitude: false,
      updateTriggers: {
        getPosition: [time],
        getNextPosition: [time],
      },
    }),
  ];

  const onSliderChange = (e: number[]) => {
    if (Array.isArray(e) && !!e.length) {
      setTime(e[0]);
    }
  };

  return (
    <main>
      <aside className="absolute left-4 top-4 z-10 w-96 bg-white p-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Current time ({time})</h3>
          <input
            type="number"
            value={time}
            step={0.01}
            onChange={(e) => setTime(Number(e.target.value))}
          />
          <Slider defaultValue={[time]} max={duration} step={0.01} onValueChange={onSliderChange} />
        </div>
      </aside>

      <DeckGL layers={[layers]} initialViewState={INITIAL_VIEW_STATE} controller={true}>
        <Map reuseMaps mapLib={Maplibregl} mapStyle={MAP_STYLE} />
      </DeckGL>
    </main>
  );
}

export default App;
