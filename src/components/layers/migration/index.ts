import { Color, CompositeLayer, LayerContext, Position } from "@deck.gl/core/typed";
import { PathGeometry } from "@deck.gl/layers/typed/path-layer/path";

import MigrationScatterplotLayer from "@/components/layers/migration/scatterplot";
// import MigrationScatterplotLayer from "@/components/layers/scatterplot-layer/scatterplot-layer";

type MigrationLayerProps = {
  data: {
    id: number | string;
    path: number[][];
    timestamps: number[];
    amount: number;
    radius: number;
    color: number[];
  }[];
  time: number;
};

export default class MigrationLayer extends CompositeLayer<MigrationLayerProps> {
  static layerName = "MigrationLayer";

  initializeState(context: LayerContext): void {
    super.initializeState(context);

    const { data } = this.props;

    const DATA = data
      .map((p) =>
        Array.from(Array(p.amount).keys()).map((d) => ({
          id: d,
          amount: p.amount,
          radius: p.radius,
          // path: p.path,
          path: p.path.map((p1) => {
            return this.getRandomCoordinates(p1, p.radius);
          }),
          // timestamps: p.timestamps,
          timestamps: this.getRandomTimestamps(p.timestamps),
          color: p.color,
        })),
      )
      .flat();

    this.setState({ DATA });
  }

  getRandomCoordinates(coordinates: number[], radiusInMeters: number) {
    // Earth's radius in meters
    const earthRadius = 6371000;
    const r = Math.random() * radiusInMeters;

    // Convert latitude and longitude from degrees to radians
    const latRad = coordinates[1] * (Math.PI / 180);
    const lngRad = coordinates[0] * (Math.PI / 180);

    // Generate a random angle in radians
    const randomAngle = Math.random() * (2 * Math.PI);

    // Calculate the new coordinates
    const newLatRad = latRad + (r / earthRadius) * Math.sin(randomAngle);
    const newLngRad = lngRad + (r / earthRadius) * Math.cos(randomAngle);

    // Convert back from radians to degrees
    const newLat = newLatRad * (180 / Math.PI);
    const newLng = newLngRad * (180 / Math.PI);

    // Ensure the values are within the valid range
    const resultLat = Math.min(Math.max(newLat, -90), 90);
    const resultLng = ((newLng + 180) % 360) - 180;

    return [resultLng, resultLat];
  }

  getRandomTimestamps(timestamps: number[]) {
    const tmpTimestamps: number[] = [];

    return timestamps
      .sort((a, b) => a - b)
      .map((t, i, p) => {
        if (i === 0) {
          tmpTimestamps.push(t);
          return t;
        }
        if (i === p.length - 1) {
          tmpTimestamps.push(t);
          return t;
        }

        // Random number between -1 and 1
        const r = Math.random() * 2 - 1;

        if (r < 0) {
          const t1 = t + r * (p[i] - tmpTimestamps[i - 1]);
          tmpTimestamps.push(t1);
          return t1;
        }

        const t1 = t + r * (p[i + 1] - t);
        tmpTimestamps.push(t1);
        return t1;
      });
  }

  renderLayers() {
    const { DATA } = this.state;
    const { time } = this.props;

    return [
      new MigrationScatterplotLayer<
        {
          path: PathGeometry;
          timestamps: number[];
          color: Color;
        },
        Record<string, unknown>
      >({
        id: `${this.props.id}-migration-scatterplot-layer`,
        data: DATA,

        getRadius: 2,
        radiusUnits: "pixels",
        getFillColor: (d) => d.color,

        uCurrentTime: time,

        getPosition: (d) => {
          const i = d.timestamps.findIndex((t) => time < t - d.timestamps[0]);
          if (i < 0) {
            return d.path[d.timestamps.length - 1] as Position;
          }
          return d.path[i - 1] as Position;
        },
        getNextPosition: (d) => {
          const i = d.timestamps.findIndex((t) => time < t - d.timestamps[0]);
          if (i < 0) {
            return d.path[d.timestamps.length - 1] as Position;
          }
          return d.path[i] as Position;
        },
        getTimestamp: (d) => {
          const i = d.timestamps.findIndex((t) => time < t - d.timestamps[0]);
          if (i < 0) {
            return d.timestamps[d.timestamps.length - 2] - d.timestamps[0];
          }
          return d.timestamps[i - 1] - d.timestamps[0];
        },
        getNextTimestamp: (d) => {
          const i = d.timestamps.findIndex((t) => time < t - d.timestamps[0]);
          if (i < 0) {
            return d.timestamps[d.timestamps.length - 1] - d.timestamps[0];
          }
          return d.timestamps[i] - d.timestamps[0];
        },
        getRandom: () => Math.random(),

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
        // parameters: {
        //   // prevent flicker from z-fighting
        //   [GL.DEPTH_TEST]: false,

        //   // turn on additive blending to make them look more glowy
        //   [GL.BLEND]: true,
        //   [GL.BLEND_SRC_RGB]: GL.ONE,
        //   [GL.BLEND_DST_RGB]: GL.ONE,
        //   [GL.BLEND_EQUATION]: GL.FUNC_ADD,
        // },
        updateTriggers: {
          getPosition: [time],
          getNextPosition: [time],
          getTimestamp: [time],
          getNextTimestamp: [time],
        },
      }),
    ];
  }
}
