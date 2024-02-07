import { Accessor, Position, UpdateParameters } from "@deck.gl/core/typed";
import { ScatterplotLayerProps, ScatterplotLayer } from "@deck.gl/layers/typed";
import GL from "@luma.gl/constants";

/** All properties supported by MigrationScatterplotLayer. */
export type MigrationScatterplotLayerProps<DataT = unknown> =
  _MigrationScatterplotLayerProps<DataT> & ScatterplotLayerProps<DataT>;

/** Properties added by MigrationScatterplotLayer. */
type _MigrationScatterplotLayerProps<DataT = unknown> = {
  uCurrentTime: number;
  /**
   * Center position accessor.
   */
  getNextPosition?: Accessor<DataT, Position>;

  /**
   * Timestamp accessor.
   */
  getTimestamp?: Accessor<DataT, number>;

  /**
   * Timestamp accessor.
   */
  getNextTimestamp?: Accessor<DataT, number>;

  /**
   * Random number accessor.
   * @default 1
   */
  getRandom?: Accessor<DataT, number>;
};

/** Render animated paths that represent vehicle Migration. */
export default class MigrationScatterplotLayer<
  DataT = unknown,
  ExtraProps = Record<string, unknown>,
> extends ScatterplotLayer<DataT, Required<_MigrationScatterplotLayerProps<DataT>> & ExtraProps> {
  static layerName = "MigrationScatterplotLayer";
  // static defaultProps = defaultProps;

  initializeState() {
    super.initializeState();

    const attributeManager = this.getAttributeManager();
    if (attributeManager) {
      attributeManager.addInstanced({
        instancePositions: {
          size: 3,
          type: GL.DOUBLE,
          fp64: this.use64bitPositions(),
          transition: true,
          accessor: "getPosition",
        },
        instanceNextPositions: {
          size: 3,
          type: GL.DOUBLE,
          fp64: this.use64bitPositions(),
          transition: true,
          accessor: "getNextPosition",
        },
        instanceTimestamp: {
          size: 1,
          transition: true,
          accessor: "getTimestamp",
        },
        instanceNextTimestamp: {
          size: 1,
          transition: true,
          accessor: "getNextTimestamp",
        },
        instanceRandom: {
          size: 1,
          transition: true,
          accessor: "getRandom",
          defaultValue: 1,
        },
      });
    }
  }

  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    const { props, oldProps } = params;
    if (props.uCurrentTime !== oldProps.uCurrentTime) {
      this.setNeedsUpdate();
    }
  }

  draw(params: { uniforms: Record<string, unknown> }) {
    const { uCurrentTime } = this.props;

    params.uniforms = {
      ...params.uniforms,
      uTime: performance.now(),
      uCurrentTime,
    };

    this.setNeedsRedraw();

    super.draw(params);
  }

  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      "vs:#decl": /* glsl */ `\
        attribute vec3 instanceNextPositions;
        attribute vec3 instanceNextPositions64Low;
        attribute float instanceTimestamp;
        attribute float instanceNextTimestamp;
        attribute float instanceRandom;
        uniform float uCurrentTime;
        uniform float uTime;
      `,
      // Timestamp of the vertex
      // "vs:#main-end": /* glsl */ `
      //   vec3 ip1 = vec3(instancePositions.x, instancePositions.y, instancePositions.z);
      //   vec3 ip2 = vec3(instanceNextPositions.x, instanceNextPositions.y, instanceNextPositions.z);

      //   vec4 p1 = project_position_to_clipspace(ip1, instancePositions64Low, offset, geometry.position);
      //   vec4 p2 = project_position_to_clipspace(ip2, instanceNextPositions64Low, offset, geometry.position);

      //   vec4 p = mix(p1, p2, (uCurrentTime - instanceTimestamp) / (instanceNextTimestamp - instanceTimestamp));
      //   gl_Position = p;

      // `,

      "vs:#main-end": /* glsl */ `
        vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
        DECKGL_FILTER_SIZE(offset, geometry);
        vec4 p1 = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
        vec4 p2 = project_position_to_clipspace(instanceNextPositions, instanceNextPositions64Low, offset, geometry.position);

        vec4 p = mix(p1, p2, (uCurrentTime - instanceTimestamp) / (instanceNextTimestamp - instanceTimestamp));
        gl_Position = p;
      `,

      "vs:DECKGL_FILTER_SIZE": /* glsl */ `
        size *= instanceRandom;
      `,
    };
    return shaders;
  }
}
