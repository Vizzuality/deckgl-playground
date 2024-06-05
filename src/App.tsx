import { useState } from "react";

import { DeckGL } from "@deck.gl/react/typed";
import Maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";

import MigrationLayer from "@/components/layers/migration";
import { Slider } from "@/components/ui/slider";

import DATA_JSON from "@/data/monarch.json";
const PATH_JSON = DATA_JSON.map((m) => {
  if ("data" in m) {
    const data = m.data as {
      id: number | string;
      path: number[][];
      timestamps: number[];
      amount: number;
      radius: number;
      color: number[];
    };
    return {
      ...data,
      timestamps: data.timestamps.map((t: number) => t * 1000),
    } as {
      id: number | string;
      path: number[][];
      timestamps: number[];
      amount: number;
      radius: number;
      color: number[];
    };
  }

  return m;
});

const INITIAL_VIEW_STATE = {
  longitude: -100,
  latitude: 40.72,
  zoom: 4,
  pitch: 0,
  bearing: 0,
};

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json";

function App() {
  const [time, setTime] = useState(0);

  // const duration = 60 * 60 * 24 * 365 * 1000;
  // const trailLength = 60 * 60 * 24 * 7 * 1000;
  const minDate = Math.min(...PATH_JSON.map((m) => m.timestamps[0]));
  const maxDate = Math.max(...PATH_JSON.map((m) => m.timestamps[m.timestamps.length - 1]));
  const duration = maxDate - minDate;

  const layers = [
    new MigrationLayer({
      id: "MigrationLayer",
      data: PATH_JSON,
      time,
    }),
  ];

  const onSliderChange = (e: number[]) => {
    if (Array.isArray(e) && !!e.length) {
      setTime(e[0]);
    }
  };

  const date = new Date(time + minDate).toISOString();

  return (
    <main>
      <aside className="absolute left-4 top-4 z-10 w-96 bg-white p-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Current time ({date})</h3>
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
