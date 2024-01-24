import { useState } from "react";

import { TripsLayer } from "@deck.gl/geo-layers/typed";
import { DeckGL } from "@deck.gl/react/typed";
import Maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";

import { Slider } from "@/components/ui/slider";

const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.72,
  zoom: 13,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

function App() {
  const [time, setTime] = useState(0);
  const duration = 2500;
  const trailLength = 50;

  const layers = [
    new TripsLayer({
      id: "TripsLayer",
      // data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf.trips.json',
      data: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json",

      /* props from TripsLayer class */

      currentTime: time,
      // fadeTrail: true,
      // getTimestamps: d => d.waypoints.map(p => p.timestamp - d.waypoints[0].timestamp),
      getTimestamps: (d) => d.timestamps,
      getRandom: () => Math.random(),
      trailLength,
      duration,
      fadeTrail: true,

      /* props inherited from PathLayer class */

      // billboard: false,
      getColor: [128, 93, 253],
      getPath: (d) => d.path,
      getWidth: 1,
      capRounded: true,
      jointRounded: true,
      // miterLimit: 4,
      // widthMaxPixels: Number.MAX_SAFE_INTEGER,
      widthMinPixels: 5,
      // widthScale: 1,
      widthUnits: "meters",

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
          <Slider
            defaultValue={[time]}
            max={duration + trailLength}
            step={1}
            onValueChange={onSliderChange}
          />
        </div>
      </aside>

      <DeckGL layers={[layers]} initialViewState={INITIAL_VIEW_STATE} controller={true}>
        <Map reuseMaps mapLib={Maplibregl} mapStyle={MAP_STYLE} />
      </DeckGL>
    </main>
  );
}

export default App;
