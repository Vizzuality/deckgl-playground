import { useState } from "react";

import { DeckGL } from "@deck.gl/react/typed";
import Maplibregl from "maplibre-gl";
import { Map } from "react-map-gl/maplibre";

import MigrationLayer from "@/components/layers/migration";
import { Slider } from "@/components/ui/slider";

// import MONARCH_JSON from "@/data/monarch.json";
import PATH_JSON from "@/data/path.json";

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
  const minDate = PATH_JSON[0].timestamps[0];
  const maxDate = PATH_JSON[0].timestamps[PATH_JSON[0].timestamps.length - 1];
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
          <Slider defaultValue={[time]} max={duration} step={0.1} onValueChange={onSliderChange} />
        </div>
      </aside>

      <DeckGL layers={[layers]} initialViewState={INITIAL_VIEW_STATE} controller={true}>
        <Map reuseMaps mapLib={Maplibregl} mapStyle={MAP_STYLE} />
      </DeckGL>
    </main>
  );
}

export default App;
