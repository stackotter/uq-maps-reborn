import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, TextInput, Keyboard } from "react-native";

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Mapbox, {MapView} from "@rnmapbox/maps";
import * as Location from 'expo-location';
import WebView from "react-native-webview";

Mapbox.setAccessToken("pk.eyJ1Ijoic3RhY2tvdHRlciIsImEiOiJjbHp3amxuY24waG02MmpvZDhmN2QyZHQyIn0.j7bBcGFDFDhwrbzj6cgWQw");

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  container: {
    height: "100%",
    width: "100%",
    backgroundColor: "tomato"
  },
  map: {
    flex: 1
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  sheetContents: {
    width: "100%",
    paddingLeft: 16,
    paddingRight: 16
  },
  input: {
    width: "100%",
    backgroundColor: "lightgray",
    borderRadius: 4,
    padding: 8
  }
});

// // From the MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
// function loadTexture(gl:ExpoWebGLRenderingContext, url: string) {
//   function isPowerOf2(value: number) {
//     return (value & (value - 1)) === 0;
//   }

//   const texture = gl.createTexture();
//   gl.bindTexture(gl.TEXTURE_2D, texture);

//   // Because images have to be downloaded over the internet
//   // they might take a moment until they are ready.
//   // Until then put a single pixel in the texture so we can
//   // use it immediately. When the image has finished downloading
//   // we'll update the texture with the contents of the image.
//   const level = 0;
//   const internalFormat = gl.RGBA;
//   const width = 1;
//   const height = 1;
//   const border = 0;
//   const srcFormat = gl.RGBA;
//   const srcType = gl.UNSIGNED_BYTE;
//   const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
//   gl.texImage2D(
//     gl.TEXTURE_2D,
//     level,
//     internalFormat,
//     width,
//     height,
//     border,
//     srcFormat,
//     srcType,
//     pixel,
//   );

//   const image = new Image();
//   image.onload = () => {
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(
//       gl.TEXTURE_2D,
//       level,
//       internalFormat,
//       srcFormat,
//       srcType,
//       image,
//     );

//     // WebGL1 has different requirements for power of 2 images
//     // vs. non power of 2 images so check if the image is a
//     // power of 2 in both dimensions.
//     if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
//       // Yes, it's a power of 2. Generate mips.
//       gl.generateMipmap(gl.TEXTURE_2D);
//     } else {
//       // No, it's not a power of 2. Turn off mips and set
//       // wrapping to clamp to edge
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     }
//   };
//   image.src = url;

//   return texture;
// }

export default function Index() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  let url = "https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/19069789677/original/KcFGNjOaJQp8XOrMyOJpS1QxY2f7yRrd4Q.jpg?1609332801";

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index == 0) {
      Keyboard.dismiss();
    }
  }, []);

  const [searchTerm, onChangeSearchTerm] = React.useState('');

  const onFocusSearchInput = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  useEffect(() => {
    Mapbox.setTelemetryEnabled(false);
  }, []);

  // function onContextCreate(gl: ExpoWebGLRenderingContext) {
  //   let texture = gl.createTexture();
  //   gl.bindTexture(gl.TEXTURE_2D, texture);

  //   // Create dummy image
  //   const level = 0;
  //   const internalFormat = gl.RGBA;
  //   const width = 1;
  //   const height = 1;
  //   const border = 0;
  //   const srcFormat = gl.RGBA;
  //   const srcType = gl.UNSIGNED_BYTE;
  //   const pixel = new Uint8Array([0, 0, 255, 255]);
  //   gl.texImage2D(
  //     gl.TEXTURE_2D,
  //     level,
  //     internalFormat,
  //     width,
  //     height,
  //     border,
  //     srcFormat,
  //     srcType,
  //     pixel,
  //   );

  //   // let textureArrayTexturePng: Promise<Uint8Array> = new Promise((accept, reject) => {
  //   //   var req = new XMLHttpRequest();
  //   //   req.open("GET", url, true);
  //   //   req.responseType = "arraybuffer";

  //   //   req.onload = function (_) {
  //   //     accept(Uint8Array.from(atob(req._response), c => c.charCodeAt(0)));
  //   //   };

  //   //   req.onerror = function (_) {
  //   //     reject();
  //   //   }

  //   //   req.send(null);
  //   // });

  //   // const loader = new THREE.ImageLoader();
  //   // loader.load(
  //   //   url,
  //   //   function (image: any) {
  //   //     console.log(typeof image);
  //   //   },
  //   //   undefined,
  //   //   function () {
  //   //     console.error('An error happened.');
  //   //   }
  //   // );
  //   // textureArrayTexturePng
  //   //   .then((arrayBuffer) => {
  //   //     gl.bindTexture(gl.TEXTURE_2D, texture);
  //   //     gl.texImage2D(
  //   //       gl.TEXTURE_2D,
  //   //       level,
  //   //       internalFormat,
  //   //       srcFormat,
  //   //       srcType,
  //   //       image,
  //   //     );
  //   //   })
  //   //   .catch((err) => {
  //   //     console.log(`Failed to get error: ${err}`);
  //   //   })

  //   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  //   gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  //   gl.clearColor(0, 1, 1, 1);

  //   // Create vertex shader (shape & position)
  //   const vert = gl.createShader(gl.VERTEX_SHADER);
  //   if (vert === null) {
  //     setErrorMsg("Failed to create vertex shader");
  //     return;
  //   }
  //   gl.shaderSource(
  //     vert,
  //     `
  //     attribute vec3 coordinates;

  //     void main(void) {
  //       gl_Position = vec4(coordinates, 1.0);
  //     }
  //   `
  //   );
  //   gl.compileShader(vert);

  //   // Create fragment shader (color)
  //   const frag = gl.createShader(gl.FRAGMENT_SHADER);
  //   if (frag === null) {
  //     setErrorMsg("Failed to create fragment shader");
  //     return;
  //   }
  //   gl.shaderSource(
  //     frag,
  //     `
  //     precision mediump float;

  //     uniform float bufferSize[2];
  //     // uniform sampler2D textureSampler;

  //     void main(void) {
  //       vec2 textureCoord = vec2(gl_FragCoord.x / bufferSize[0], gl_FragCoord.y / bufferSize[1]);
  //       gl_FragColor = texture(uSampler, vTextureCoord);
  //     }
  //   `
  //   );
  //   gl.compileShader(frag);

  //   const program = gl.createProgram();
  //   if (program === null) {
  //     setErrorMsg("Failed to create shader program");
  //     return;
  //   }
  //   gl.attachShader(program, vert);
  //   gl.attachShader(program, frag);
  //   gl.linkProgram(program);
  //   gl.useProgram(program);

  //   gl.clear(gl.COLOR_BUFFER_BIT);

  //   let textureSamplerLocation = gl.getUniformLocation(program, "textureSampler");
  //   gl.activeTexture(gl.TEXTURE0);
  //   gl.bindTexture(gl.TEXTURE_2D, texture);
  //   gl.uniform1i(textureSamplerLocation, 0);

  //   let vertices = [
  //      -1,  1, 0,
  //      -1, -1, 0,
  //       1, -1, 0, 
  //       1,  1, 0
  //   ];
  //   let indices = [0, 1, 2, 2, 3, 0]; 

  //   let size = [gl.drawingBufferWidth, gl.drawingBufferHeight];
  //   let bufferSizeLocation = gl.getUniformLocation(program, "bufferSize");
  //   gl.uniform1fv(bufferSizeLocation, size);

  //   var vertexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  //   gl.bindBuffer(gl.ARRAY_BUFFER, null);

  //   var indexBuffer = gl.createBuffer();
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  //   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  //   gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  //   var coord = gl.getAttribLocation(program, "coordinates");
  //   gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0); 
  //   gl.enableVertexAttribArray(coord);

  //   gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);

  //   gl.flush();
  //   gl.endFrameEXP();
  // }

  // const colorMap = useLoader(TextureLoader, 'https://s3.amazonaws.com/cdn.freshdesk.com/data/helpdesk/attachments/production/19069789677/original/KcFGNjOaJQp8XOrMyOJpS1QxY2f7yRrd4Q.jpg?1609332801');
  // let size = 100;

  // <GLView style={{ width: "100%", aspectRatio: 1, marginTop: 16 }} onContextCreate={onContextCreate} />

  // TODO: Update backend to display 360 images in simple js 360 image viewer
  // TODO: Line up camera with north when taking photos
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.page}>
        <View style={styles.container}>
          <MapView style={styles.map} />
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={['20%', '80%']}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={styles.contentContainer}>
            <View style={styles.sheetContents}>
              <TextInput
                style={styles.input}
                onChangeText={onChangeSearchTerm}
                onFocus={onFocusSearchInput}
                value={searchTerm}
                placeholder="Search UQ..."
              />
            </View>
            <WebView source={{
              html: `
              <html>
                <body>
                </body>
              </html>
              `
            }} style={{ width: "100%", height: 500 }}/>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
