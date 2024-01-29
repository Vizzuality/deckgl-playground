// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { AccessorFunction, DefaultProps } from "@deck.gl/core/typed";
import { PathLayer, PathLayerProps } from "@deck.gl/layers/typed";
import type { NumericArray } from "@math.gl/core";

const defaultProps: DefaultProps<MigrationLayerProps> = {
  fadeTrail: true,
  trailLength: { type: "number", value: 120, min: 0 },
  duration: { type: "number", value: 2050, min: 0 },
  currentTime: { type: "number", value: 0, min: 0 },
  getTimestamps: { type: "accessor", value: () => [] },
};

/** All properties supported by MigrationLayer. */
export type MigrationLayerProps<DataT = unknown> = _MigrationLayerProps<DataT> &
  PathLayerProps<DataT>;

/** Properties added by MigrationLayer. */
type _MigrationLayerProps<DataT = unknown> = {
  /**
   * Duration of the animation.
   * @default 2050
   */
  duration?: number;
  /**
   * Whether or not the path fades out.
   * @default true
   */
  fadeTrail?: boolean;
  /**
   * Trail length.
   * @default 120
   */
  trailLength?: number;
  /**
   * The current time of the frame.
   * @default 0
   */
  currentTime?: number;
  /**
   * Timestamp accessor.
   */
  getTimestamps?: AccessorFunction<DataT, NumericArray>;
};

/** Render animated paths that represent vehicle Migration. */
export default class MigrationLayer<
  DataT = unknown,
  ExtraProps = Record<string, unknown>,
> extends PathLayer<DataT, Required<_MigrationLayerProps<DataT>> & ExtraProps> {
  static layerName = "MigrationLayer";
  static defaultProps = defaultProps;

  initializeState() {
    super.initializeState();

    const attributeManager = this.getAttributeManager();
    if (attributeManager) {
      attributeManager.addInstanced({
        timestamps: {
          size: 1,
          accessor: "getTimestamps",
          shaderAttributes: {
            instanceTimestamps: {
              vertexOffset: 0,
            },
            instanceNextTimestamps: {
              vertexOffset: 1,
            },
          },
        },
        random: {
          size: 1,
          accessor: "getRandom",
          shaderAttributes: {
            instanceRandoms: {
              vertexOffset: 0,
            },
          },
        },
      });
    }
  }

  draw(params: { uniforms: Record<string, unknown> }) {
    const { fadeTrail, trailLength, currentTime, duration } = this.props;

    params.uniforms = {
      ...params.uniforms,
      uTime: performance.now(),
      fadeTrail,
      trailLength,
      duration,
      currentTime,
    };

    this.setNeedsRedraw();

    super.draw(params);
  }

  getShaders() {
    const shaders = super.getShaders();
    shaders.inject = {
      "vs:#decl": /* glsl */ `\
        uniform bool fadeTrail;
        uniform float trailLength;
        uniform float currentTime;
        uniform float duration;
        uniform float uTime;

        attribute float instanceTimestamps;
        attribute float instanceNextTimestamps;

        attribute float instanceRandoms;
        varying float vTime;
        varying float vPathPercentage;

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

  // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
    }
      `,
      // Timestamp of the vertex
      "vs:#main-end": /* glsl */ `
        // 0 - 1 on each segment
        vPathPercentage = vPathPosition.y / vPathLength;
        // vTime interpolated between the two timestamps
        vTime = instanceTimestamps + ((instanceNextTimestamps - instanceTimestamps) * (vPathPercentage));
        // vTime = instanceTimestamps;
      `,
      "vs:DECKGL_FILTER_SIZE": /* glsl */ `
        size *= instanceRandoms;
      `,

      "vs:DECKGL_FILTER_GL_POSITION": /* glsl */ `
        float nx = snoise(position.xyz) * (sin(uTime * 2.0 * instanceRandoms / 1000.0) * 0.5 + 0.5) * 0.1;
        float ny = snoise(position.xyz) * (sin(uTime * 1.0 * instanceRandoms / 1000.0) * 0.5 + 0.5) * 0.2;
        position.x += nx;
        position.y += ny;
      `,

      "fs:#decl": /* glsl */ `
        uniform bool fadeTrail;
        uniform float trailLength;
        uniform float currentTime;
        varying float vTime;
        varying float vPathPercentage;
      `,
      // Drop the segments outside of the time window
      "fs:#main-start": /* glsl */ `\
        if(vTime < 1.0 || vTime > currentTime || (fadeTrail && (vTime < currentTime - trailLength))) {
          discard;
        }
      `,
      // Fade the color (currentTime - 100%, end of trail - 0%)
      "fs:DECKGL_FILTER_COLOR": /* glsl */ `\
        if(fadeTrail) {
          // color.r = 0.5;
          // color.g = vPathPercentage;
          // color.b = 0.5;
          if (currentTime < trailLength) {
            color.a *= 1.0 - (currentTime - vTime) / currentTime;
          } else {
            color.a *= 1.0 - (currentTime - vTime) / trailLength;
          }

          // color.a *= 1.0 - (currentTime - vTime) / trailLength;
        }
      `,
    };
    return shaders;
  }
}
